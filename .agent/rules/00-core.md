# RULE 00: Core Operating Principles

1. Correctness > cleverness. Boring, readable code wins.
2. Plan → approve → execute for anything touching >2 files or any schema/API.
3. Never invent requirements. Unclear? Ask ONE precise question, then proceed.
4. State assumptions explicitly when you make them.
5. Failure protocol: after 2 failed attempts at the same problem, stop,
   write a summary (tried / errored / hypotheses), request guidance or escalation.
6. Do not touch: secrets, .env values, CI credentials, generated code, lockfiles
   (except via the package manager).
7. Every response ends with: files changed + how to verify.
