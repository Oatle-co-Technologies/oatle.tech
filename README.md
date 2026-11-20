<<<<<<< HEAD
# oatle-website
# Oatle Technologies
=======
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).
>>>>>>> b4e9976 (Complete Oatle Technologies website)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

### Staff appointments with the owner

Staff can use **Book appointment with Vinolia** on the overview or Appointments page. `/appointments/with-owner` requires a verified active staff session and binds the participant ID/name/email to that session. The organiser is the configured `DISCOVERY_ORGANIZER_EMAIL` owner (default `info@oatle-technologies.co.za`), who must be an active admin. The staff form accepts only subject, future start/end times and notes; meetings last at most two hours. Times use Africa/Johannesburg through the existing calendar conversion. Existing free/busy checks, conflict handling and Google Calendar creation are reused, so successful bookings are saved with the Google event ID. Owner-only general creation, edit and delete controls retain their existing permissions. No database migration or new Google credentials are required.

Verification: `tests/test_staff_appointments.py` covers verified identity binding, rejected identity overrides, future/duration validation and unavailable organiser handling. `tests/staff-appointments.test.cjs` checks the member form and its restricted request payload with synthetic auth/network responses. These tests create no live appointments or calendar invitations.
