import { Resend } from 'resend';
import BookingReceiptEmail from '@/emails/BookingReceiptEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

interface ReceiptData {
    email: string;
    name: string;
    bookingDetails: string[];
    transactionRef: string;
    amount: number;
    date: string;
}

export async function sendReceipt(data: ReceiptData) {
    if (!process.env.RESEND_API_KEY) {
        console.warn("RESEND_API_KEY is missing. Email skipped.");
        return;
    }

    try {
        const { data: emailData, error } = await resend.emails.send({
            from: 'TESA Convocation <bookings@resend.dev>', // Change this if you have a verified domain
            to: [data.email],
            subject: `Booking Confirmed - ${data.transactionRef}`,
            react: <BookingReceiptEmail
                customerName={data.name}
                bookingDetails={data.bookingDetails}
                transactionRef={data.transactionRef}
                amount={data.amount}
                date={data.date}
            />,
        });

        if (error) {
            console.error('Error sending email:', error);
            return { success: false, error };
        }

        console.log('Email sent successfully:', emailData);
        return { success: true, data: emailData };

    } catch (e) {
        console.error('Unexpected error sending email:', e);
        return { success: false, error: e };
    }
}
