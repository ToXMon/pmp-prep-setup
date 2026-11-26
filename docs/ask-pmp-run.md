# Run Ask PMP

- Date: 2026-11-25
- POC: PMP Prep Setup maintainer
- TL;DR: Keep the public quiz on GitHub Pages. Run the password-protected coach on Akash. No GitHub OAuth app is needed.

## Prepare the image and deployment

From the PMP Content root:

```sh
docker buildx build --platform linux/amd64 --build-context content=. --load -t ask-pmp:local pmp-prep-setup
akt sdl validate pmp-prep-setup/akash.example.yaml
akt deploy pmp-prep-setup/akash.example.yaml --dry-run
```

The template does not create a deployment. A live order can consume gas and lock escrow; check the bid before accepting a lease. The public image contains original semantic topic summaries and source locators, not raw transcripts or secrets. The Akash template pins the published image by digest. A separate local deployment can still use the original transcripts via `PMP_CONTENT_ROOT`.

## Configure the live service

Set `SURPLUS_API_KEY` to a funded inference key, `PMP_PASSWORD` to a random password of at least 20 characters, and `PMP_ORIGIN` to the coach's exact HTTPS origin with no trailing slash. Enter these through a private deployment input, not chat or Git. The Akash provider can access runtime values. Open `/ask.html` over HTTPS and enter username `pmp` and your app password. For a local test, `PMP_ORIGIN` can be `http://127.0.0.1:8080`.

The coach uses `glm-5.3` through Surplus’s `/min99/v1/chat/completions` route. The floor is an estimated discount relative to reference price. Disable buyer-owned priority and fallback routes because Surplus does not apply the floor to them. The app does not lower the threshold or change models. It retries once only for a documented supply cooldown within a short retry interval.

## Verify before updating the public link

Run `python3 -m unittest test_coach` and `node --test` from the app repo. At the hosted HTTPS URL, check `/healthz`, the password challenge, rejection of anonymous inference, and one authorized synthetic inference before testing with real course text. After these checks, point the GitHub Pages entry to the coach URL. The coach does not save chat history.
