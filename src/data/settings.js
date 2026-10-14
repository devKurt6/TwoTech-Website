import { defaultServices } from "./services.js";
import { policies } from "./policies.js";
export const defaults = {
  headline: "Your Partner in IT Solutions, Repairs & Custom Development.",
  banner: "",
  phone: "+63 963 310 2486",
  email: "twotech0128@gmail.com",
  address:
    "Purok 4, Brgy. Sta. Maria, Filinvest Rd, Santo Tomas, Batangas, Philippines",
  hours: "9:00 AM–8:00 PM (days to be confirmed)",
  facebook: "https://www.facebook.com/Engr.TwoTECH",
  delivery_fee: 150,
  payment_instructions:
    "Contact Two Tech for verified bank or GCash transfer instructions before sending payment.",
  founder_bio:
    "Kurt Decena is a Computer Engineering graduate with IT support and software development experience.",
  low_stock_threshold: 5,
  services: defaultServices,
  booking_times: ["9:00 AM", "11:00 AM", "1:00 PM", "3:00 PM", "5:00 PM"],
  quote_categories: [
    "Website",
    "Desktop Application",
    "Automation",
    "AI/Image Processing",
    "Embedded Systems/IoT",
    "Other",
  ],
  quote_budgets: [
    "Under ₱10,000",
    "₱10,000 – ₱30,000",
    "₱30,000 – ₱100,000",
    "Above ₱100,000",
    "Not sure yet",
  ],
  maps: "https://maps.app.goo.gl/KLWRCZbpFzx4qBjE8",
  founder_name: "Kurt Decena",
  service_area: "Nearby areas subject to availability.",
  business_intro:
    "Two Tech (Computer Engrs' Repair Services) is a Philippines-based business offering computer parts, repair and maintenance, software development, automation, and embedded systems projects.",
  policies,
};
