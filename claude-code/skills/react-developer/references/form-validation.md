# Validation: React Hook Form + Zod

The native Form Actions covered in `forms.md` (`useActionState`, `useFormStatus`) are the right default for simple forms — a newsletter signup, a single search box. Once a form has several interdependent fields, cross-field rules, dynamic field arrays, or needs validation errors surfaced per-field as the user types, reach for **React Hook Form** (uncontrolled-first form state, minimal re-renders) paired with **Zod** (schema-driven validation with static type inference) via `@hookform/resolvers`.

## Defining the schema

Model the form's shape once, as a Zod schema. Both the runtime validation and the TypeScript type come from this single source of truth.

```ts
import { z } from 'zod';

export const signUpSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(8, 'At least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SignUpValues = z.infer<typeof signUpSchema>;
```

- `z.infer<typeof schema>` derives the form's TypeScript type — change a validation rule and the type updates with it, no manual duplication.
- `.refine()` handles cross-field rules (password confirmation, date ranges); attach the error to a specific field via `path`.

## Wiring `useForm` + `zodResolver`

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signUpSchema, type SignUpValues } from './sign-up-schema';

function SignUpForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (values: SignUpValues) => {
    await fetch('/api/sign-up', {
      method: 'POST',
      body: JSON.stringify(values),
      headers: { 'Content-Type': 'application/json' },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} placeholder="Name" />
      {errors.name && <p role="alert">{errors.name.message}</p>}

      <input {...register('email')} placeholder="Email" />
      {errors.email && <p role="alert">{errors.email.message}</p>}

      <input type="password" {...register('password')} placeholder="Password" />
      {errors.password && <p role="alert">{errors.password.message}</p>}

      <input type="password" {...register('confirmPassword')} placeholder="Confirm password" />
      {errors.confirmPassword && <p role="alert">{errors.confirmPassword.message}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating account…' : 'Sign up'}
      </button>
    </form>
  );
}
```

- `resolver: zodResolver(schema)` is the only glue needed — RHF runs the schema on every validation pass and maps Zod issues onto `formState.errors` per field.
- `register('fieldName')` wires an uncontrolled input's `name`, `onChange`, `onBlur`, and `ref` in one spread — RHF reads values directly from the DOM instead of storing them in React state, which is why RHF avoids the re-render-per-keystroke cost of controlled forms.
- `handleSubmit(onSubmit)` only calls `onSubmit` if validation passes; on failure it populates `errors` and skips the call.
- `formState.isSubmitting` tracks the submit handler's promise — no separate pending state to manage by hand.

## Controlled fields with `Controller`

`register` assumes a native input. For a non-native / controlled component (a custom `<Select>`, a date picker, a component library's input), wrap it in `Controller` instead.

```tsx
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

function RoleField({ control }: { control: Control<SignUpValues> }) {
  return (
    <Controller
      name="role"
      control={control}
      render={({ field, fieldState }) => (
        <>
          <CustomSelect {...field} options={['admin', 'member']} />
          {fieldState.error && <p role="alert">{fieldState.error.message}</p>}
        </>
      )}
    />
  );
}
```

- `field` gives you `value`, `onChange`, `onBlur`, and `ref` to forward to the custom component.
- `fieldState.error` is the same per-field error `register`-based fields get from `formState.errors`, scoped to this one `Controller`.

## Dynamic field arrays with `useFieldArray`

For "add another item" style forms (e.g. a list of phone numbers), `useFieldArray` keeps the array in sync with the schema and RHF's internal state.

```ts
const phoneSchema = z.object({
  phones: z.array(z.object({ number: z.string().min(7, 'Too short') })).min(1),
});

const { control, register } = useForm({ resolver: zodResolver(phoneSchema) });
const { fields, append, remove } = useFieldArray({ control, name: 'phones' });
```

- Iterate `fields` to render one row per entry, using `field.id` (not array index) as the React `key`.
- `append({ number: '' })` and `remove(index)` mutate the array; RHF re-validates against the schema's `z.array(...)` rule.

## Choosing between the two approaches

- **Form Actions (`useActionState`)** — simple forms, few fields, validation is basically "is it non-empty" / one server round-trip check. Less code, no extra dependency.
- **React Hook Form + Zod** — multi-field forms, cross-field rules, field arrays, need per-field errors live as the user types, or want the schema/type to be the single source of truth shared with an API layer.
- The two are not mutually exclusive: RHF's `handleSubmit` can call into the same async function you'd otherwise pass to a `useActionState` action — the schema validation just runs client-side first.
