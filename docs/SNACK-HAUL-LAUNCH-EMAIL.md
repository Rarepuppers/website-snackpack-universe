# Snack Haul launch email

Use one Brevo account with separate lists for the general newsletter and the launch alert.

| List | Where people sign up | What they agreed to receive |
| --- | --- | --- |
| **Website Leads (4)** | Homepage newsletter and pages that reuse the general form | SnackPack Universe news, including new app launches and major updates |
| **Snack Haul Launch Alerts (15)** | The hosted Snack Haul form linked from the game page and the homepage and Apps spotlights | One launch announcement after double opt-in |

The [Snack Haul launch campaign](https://app.brevo.com/marketing-campaign/edit/45) is an unscheduled draft with both lists selected. Its footer covers both signup paths and includes Brevo’s unsubscribe link. Brevo sends a single copy per eligible address within the campaign. [Brevo recipient rules](https://help.brevo.com/hc/en-us/articles/15152720243730-Exclude-and-filter-recipients-from-your-email-campaigns)

## Check signup source

In Brevo, open a contact and check **Lists** for subscription membership and **History** for the form submission, where recorded. **Website Leads** identifies a general newsletter signup. Pages that share that form also share its list, so membership alone cannot identify the exact page. The homepage and Apps spotlights both lead to the same Snack Haul form. Track those button placements separately if a future campaign needs a placement comparison. [Brevo form reporting](https://help.brevo.com/hc/en-us/articles/208771869-Create-a-sign-up-form-in-Brevo)

## Launch day

1. Confirm the public Google Play listing opens for a signed-out visitor in the intended market.
2. Follow the app page’s launch notes to publish its store CTA and QR. Update the homepage and Apps spotlight wording and links in the same site change.
3. Verify the email’s CTA reaches the released app page and that the app page links to Google Play. Preview the draft and confirm the two selected lists, eligible recipient count and unsubscribe link.
4. Send this single campaign after release approval.

## After launch

Offer a separate, optional double-opt-in **Snack Haul Updates** signup on the app page for major releases and expansions. Make the frequency and purpose clear in the form. A 2.0 announcement can go to eligible **Website Leads** contacts and people who opted in to **Snack Haul Updates**. The launch-only consent covers the original announcement. [ACMA guidance on email consent](https://www.acma.gov.au/avoid-sending-spam)

For the next app, duplicate the draft design and replace the content, product link and audience. Create a release-specific list and double opt-in form, and add the hosted form link in `scripts/build-newsletter-cta.mjs`. Check the new form’s promises before choosing recipients.
