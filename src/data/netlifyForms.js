// Field allowlists shared by the static detection page and browser submissions.
const contact = ["reference", "name", "email", "phone"];
export const NETLIFY_FORMS_PATH = "/netlify-forms.html";
export const netlifyForms = {
  bookings: [
    ...contact,
    "service",
    "device",
    "problem",
    "preferred_date",
    "preferred_time",
    "mode",
    "address",
  ],
  quotes: [
    ...contact,
    "category",
    "title",
    "requirements",
    "hardware",
    "budget",
    "target_date",
    "reference_link",
  ],
  messages: ["reference", "name", "email", "body"],
  orders: [
    ...contact,
    "delivery_method",
    "address",
    "payment_method",
    "items",
    "total",
    "currency",
    "payment_status",
  ],
};
