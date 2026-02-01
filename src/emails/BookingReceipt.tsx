import {
    Body,
    Container,
    Column,
    Head,
    Heading,
    Hr,
    Html,
    Preview,
    Row,
    Section,
    Text,
    Tailwind,
} from "@react-email/components";

interface BookingReceiptProps {
    customerName?: string;
    bookingDetails?: string[];
    transactionRef?: string;
    amount?: number;
    date?: string;
    chairs?: number;
    tables?: number;
    baseFee?: number;
    logisticsFee?: number;
    tentName?: string;
}

export const BookingReceipt = ({
    customerName = "Valued Customer",
    bookingDetails = ["NLNG Front - Seat 5", "NLNG Back - Seat 12"],
    transactionRef = "REF-123456789",
    amount = 13000,
    date = "October 24, 2025",
    chairs = 0,
    tables = 0,
    baseFee = 0,
    logisticsFee = 0,
    tentName = ""
}: BookingReceiptProps) => {
    return (
        <Html>
            <Head />
            <Preview>Your booking for the TECH Induction is confirmed.</Preview>
            <Tailwind
                config={{
                    theme: {
                        extend: {
                            colors: {
                                brand: "#4f46e5", // Indigo-600
                                offwhite: "#f8fafc",
                            },
                        },
                    },
                }}
            >
                <Body className="bg-offwhite my-auto mx-auto font-sans">
                    <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px] bg-white">
                        <Section className="mt-[32px]">
                            {/* Logo or Title Placeholder */}
                            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                                <strong>TECH Induction</strong>
                            </Heading>
                        </Section>

                        <Heading className="text-black text-[20px] font-normal text-center p-0 my-[30px] mx-0">
                            Tent Reservation Confirmed
                        </Heading>

                        <Text className="text-black text-[14px] leading-[24px]">
                            Hello {customerName},
                        </Text>
                        <Text className="text-black text-[14px] leading-[24px]">
                            Thank you for booking your tent(s) for the TECH Induction. Your payment has been processed successfully.
                        </Text>

                        <Section className="mt-[32px] mb-[32px] p-[20px] bg-gray-50 rounded">
                            <Text className="m-0 text-[12px] text-gray-500 uppercase tracking-widest">
                                Transaction Reference
                            </Text>
                            <Text className="m-0 text-[14px] font-medium text-black mb-[20px]">
                                {transactionRef}
                            </Text>

                            <Text className="m-0 text-[12px] text-gray-500 uppercase tracking-widest">
                                Preferred Tent Name
                            </Text>
                            <Text className="m-0 text-[18px] font-bold text-brand mb-[20px]">
                                {tentName || "N/A"}
                            </Text>

                            <Text className="m-0 text-[12px] text-gray-500 uppercase tracking-widest">
                                Reservation Details
                            </Text>
                            <ul className="pl-5 m-0 mb-[20px]">
                                <li className="text-[14px] font-medium text-black mb-1">
                                    Tents Booked: {bookingDetails.length}
                                </li>
                                {chairs > 0 && (
                                    <li className="text-[14px] font-medium text-black mb-1">
                                        Chairs: {chairs} Dozen
                                    </li>
                                )}
                                {tables > 0 && (
                                    <li className="text-[14px] font-medium text-black mb-1">
                                        Tables: {tables} Units
                                    </li>
                                )}
                                <li className="text-[14px] font-medium text-black mb-1">
                                    Logistics Fee: ₦3,000
                                </li>
                            </ul>

                            <Text className="m-0 text-[12px] text-gray-500 uppercase tracking-widest mt-4">
                                Assigned Tents
                            </Text>
                            <ul className="pl-5 m-0 mb-[20px]">
                                {bookingDetails.map((detail, index) => (
                                    <li key={index} className="text-[14px] text-gray-600 mb-1">
                                        {detail}
                                    </li>
                                ))}
                            </ul>

                            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />

                            <Row>
                                <Column align="left">
                                    <Text className="m-0 text-[14px] font-semibold text-black">
                                        TOTAL PAID
                                    </Text>
                                </Column>
                                <Column align="right">
                                    <Text className="m-0 text-[18px] font-bold text-brand">
                                        ₦{amount?.toLocaleString()}
                                    </Text>
                                </Column>
                            </Row>
                        </Section>

                        <Text className="text-black text-[14px] leading-[24px]">
                            Please show this email at the venue entrance.
                        </Text>

                        <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />

                        <Text className="text-[#666666] text-[12px] leading-[24px] text-center">
                            Technology Engineering Students Association
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default BookingReceipt;
