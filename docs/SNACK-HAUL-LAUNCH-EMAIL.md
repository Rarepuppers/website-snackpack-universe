# Snack Haul launch email

- Brevo signup form **Snack Haul Launch Alerts** uses the studio’s double opt-in confirmation template. Signups go to the dedicated list **Snack Haul Launch Alerts** (15) after email confirmation.
- Brevo campaign [Snack Haul | Google Play launch](https://app.brevo.com/marketing-campaign/edit/45) (45) is an unscheduled draft from the verified SnackPack Universe sender. Brevo requires at least one eligible recipient before it saves an audience. Assign only the dedicated list when it has confirmed subscribers, and verify the audience before sending.
- The website’s homepage and Apps spotlight link to the trailers and the Snack Haul signup section. The app page links to the hosted form through `scripts/build-newsletter-cta.mjs`.

## Launch day

1. Confirm the public Google Play listing opens for a signed-out visitor in the intended market.
2. Follow the app page’s launch notes to publish its store CTA and QR. Update the homepage and Apps spotlight wording and links in the same site change.
3. Verify the email’s app-page CTA reaches the store CTA. Preview the draft in Brevo, check the unsubscribe link, select the dedicated list and review the eligible audience.
4. Send the announcement after release approval.

## Reuse for the next app

Duplicate the campaign for its layout, sender and unsubscribe link. Replace the subject, preview, artwork, message and product link. Create a release-specific list and double opt-in form. Select that list in the new campaign, and add the public form link and product copy to the website signup generator. Keep each release’s signup tied to the email it promises.
