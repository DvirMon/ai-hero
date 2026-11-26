"""Tests for build-report.py. Run:
python3 -m unittest plugins/figma/skills/visual-verify/scripts/test_build_report.py"""
import base64, json, os, subprocess, sys, tempfile, unittest

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPT = os.path.join(HERE, 'build-report.py')
PNG = base64.b64decode(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==')


def section(i, verdict, images=True, clusters=None):
    s = {'id': f's{i}', 'name': f'State {i}', 'verdict': verdict, 'note': ''}
    if images:
        s.update(dir=f's{i}', res=f's{i}/res.json', diffAreaPct=1.5,
                 clusters=clusters or [])
    else:
        s['note'] = 'needs the full-admin role'
    return s


def report_with_verdicts(verdicts, images=True):
    return {'title': 'Visual verify', 'sections': [
        section(i, v, images) for i, v in enumerate(verdicts)]}


def report_with_cluster(**cluster):
    c = {'x': 0, 'y': 0, 'w': 1, 'h': 1, 'figmaValue': '16px', 'appValue': '12px',
         'fromComponent': None, 'component': None, 'variant': None, **cluster}
    return {'title': 'Visual verify', 'sections': [
        section(0, 'needs approval', clusters=[c])]}


def build(report):
    with tempfile.TemporaryDirectory() as d:
        for s in report['sections']:
            if 'dir' not in s:
                continue
            os.makedirs(os.path.join(d, s['dir']))
            for f in ('figma.png', 'local.png', 'diff.png'):
                with open(os.path.join(d, s['dir'], f), 'wb') as fh:
                    fh.write(PNG)
            with open(os.path.join(d, s['res']), 'w') as fh:
                json.dump({'clusters': s['clusters'], 'sizeMismatch': False,
                           'comparedSize': {'w': 1, 'h': 1}}, fh)
        rp, out = os.path.join(d, 'report.json'), os.path.join(d, 'out.html')
        with open(rp, 'w') as fh:
            json.dump(report, fh)
        subprocess.run([sys.executable, SCRIPT, rp, out], check=True,
                       capture_output=True)
        with open(out) as fh:
            return fh.read()


class BuildReportTest(unittest.TestCase):
    def test_renders_every_verdict(self):
        html = build(report_with_verdicts([
            'matching', 'fixed', 'accepted', 'needs approval', 'older difference',
            'not run']))
        for label in ['Matching', 'Fixed', 'Accepted', 'Needs approval',
                      'Older difference', 'Not run']:
            self.assertIn(label, html)

    def test_cluster_from_component_is_shown(self):
        html = build(report_with_cluster(fromComponent='v-button',
                                         property='padding-left'))
        self.assertIn('v-button', html)
        self.assertIn('padding-left', html)

    def test_not_run_section_needs_no_images(self):
        html = build(report_with_verdicts(['not run'], images=False))
        self.assertIn('Not run', html)

    def test_report_text_cannot_break_the_script(self):
        report = report_with_verdicts(['needs approval'])
        report['sections'][0]['copy'] = [
            {'figma': 'Save', 'app': '<!--<script></script>'}]
        html = build(report)
        self.assertNotIn('<!--', html)
        self.assertEqual(html.count('</script'), 1)


if __name__ == '__main__':
    unittest.main()
