export async function GET() {
  const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTPnWI_pVzKgZOWAvVEAaSaJsob_oUNMOf4ZukA6ScOzMtkw4wIyUE7GCTorH7PSZYsoNitYDuT8d8Y/pub?gid=1075171072&single=true&output=csv";

  try {
    const res = await fetch(url);
    const text = await res.text();

    return new Response(text, {
      headers: {
        "Content-Type": "text/plain",
      },
    });
  } catch (err) {
    return new Response("Error", { status: 500 });
  }
}
