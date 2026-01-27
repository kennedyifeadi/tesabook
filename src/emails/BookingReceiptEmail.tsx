import {
    Body,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Img,
    Preview,
    Section,
    Text,
    Tailwind,
    Row,
    Column,
} from "@react-email/components";
import * as React from "react";

interface BookingReceiptEmailProps {
    customerName: string;
    bookingDetails: string[]; // e.g., ["NLNG Front - Seat 1", "NLNG Front - Seat 2"]
    transactionRef: string;
    amount: number;
    date: string;
}

export const BookingReceiptEmail = ({
    customerName,
    bookingDetails,
    transactionRef,
    amount,
    date,
}: BookingReceiptEmailProps) => {
    const previewText = `Booking Confirmed - ${transactionRef}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${transactionRef}`;

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Tailwind
                config={{
                    theme: {
                        extend: {
                            colors: {
                                indigo: {
                                    600: "#4f46e5",
                                },
                                slate: {
                                    500: "#64748b",
                                    800: "#1e293b",
                                    900: "#0f172a",
                                },
                            },
                        },
                    },
                }}
            >
                <Body className="bg-white my-auto mx-auto font-sans">
                    <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
                        <Section className="mt-[32px]">
                            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                                Booking Confirmed
                            </Heading>
                        </Section>

                        <Text className="text-slate-900 text-[14px] leading-[24px]">
                            Hello {customerName},
                        </Text>
                        <Text className="text-slate-500 text-[14px] leading-[24px]">
                            Your booking for the TESA Convocation Event has been successfully processed. Below are your booking details.
                        </Text>

                        <Section className="my-[32px] bg-slate-50 p-6 rounded-lg">
                            <Text className="m-0 text-xs font-semibold uppercase text-slate-500 mb-4">
                                Your Seats
                            </Text>
                            {bookingDetails.map((detail, index) => (
                                <Text key={index} className="m-0 text-base font-medium text-slate-900 mb-2">
                                    • {detail}
                                </Text>
                            ))}
                        </Section>

                        <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />

                        <Section>
                            <Row>
                                <Column>
                                    <Text className="text-slate-500 text-[12px] uppercase">Transaction Ref</Text>
                                    <Text className="text-slate-900 text-[14px] font-medium mt-1">{transactionRef}</Text>

                                    <Text className="text-slate-500 text-[12px] uppercase mt-4">Date</Text>
                                    <Text className="text-slate-900 text-[14px] font-medium mt-1">{date}</Text>

                                    <Text className="text-slate-500 text-[12px] uppercase mt-4">Amount Paid</Text>
                                    <Text className="text-slate-900 text-[14px] font-medium mt-1">₦{amount?.toLocaleString()}</Text>
                                </Column>
                                <Column align="right">
                                    <Img
                                        src={qrCodeUrl}
                                        width="100"
                                        height="100"
                                        alt="QR Code"
                                        className="block"
                                    />
                                    <Text className="text-slate-500 text-[10px] text-center mt-2">Scan at Entry</Text>
                                </Column>
                            </Row>
                        </Section>

                        <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />

                        <Text className="text-[#666666] text-[12px] leading-[24px]">
                            If you have any questions, please contact the TESA executive team.
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default BookingReceiptEmail;
