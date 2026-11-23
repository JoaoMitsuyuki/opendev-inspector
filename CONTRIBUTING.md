# Contributing

Thank you for helping improve OpenDev Inspector.

1. Discuss substantial behavior or scope changes before implementation.
2. Create a focused branch and keep changes small.
3. Add positive and negative tests for every detection rule.
4. Never commit real credentials; construct fictitious values inside tests.
5. Run `npm run check` before proposing a change.

Rule IDs and JSON result fields are public contracts. Changes to them require a compatibility note. New scanners must not execute scanned project code, follow symbolic links, expose full secret values, or change scanned files.
