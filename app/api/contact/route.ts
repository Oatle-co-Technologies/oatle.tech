import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { name, business, email, phone, service, message } = body;

    await resend.emails.send({
      from: "Oatle <onboarding@resend.dev>",
      to: "oatle.tehnologies@gmail.com",
      subject: `New Discovery Enquiry from ${name}`,

      html: `
        <h2>New Discovery Call Enquiry</h2>

        <p><strong>Name:</strong> ${name}</p>

        <p><strong>Business:</strong> ${business}</p>

        <p><strong>Email:</strong> ${email}</p>

        <p><strong>Phone:</strong> ${phone}</p>

        <p><strong>Service:</strong> ${service}</p>

        <p><strong>Message:</strong></p>

        <p>${message}</p>
      `,
    });

    return Response.json({
      success: true,
    });

  } catch (error) {

    return Response.json(
      {
        success: false,
        error,
      },
      {
        status: 500,
      }
    );

  }
}