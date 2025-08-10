import { serve } from "bun";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

let error: string | undefined;
const items: { stamp: Date; title: string }[] = [];
let stamp: Date = new Date(0);

const htmlRewriter = new HTMLRewriter()
  .on("#homepage_tickets div.product.item.ticket span.eventDate", {
    text(text) {
      if (error) {
        return;
      }

      const line = text.text.trim();
      if (!line) {
        return;
      }

      const regex =
        /(?<day>\d{1,2})\s+(?<month>Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/;
      const match = line.match(regex);
      if (!match || !match.groups?.day || !match.groups?.month) {
        error = `Invalid date line: ${line}`;
        return;
      }

      const { day, month } = match.groups;
      const stamp = new Date(
        new Date().getFullYear(),
        MONTHS.indexOf(month),
        +day
      );

      items.push({ stamp, title: "" });
    },
  })
  .on("#homepage_tickets div.product.item.ticket span.eventTime", {
    text(text) {
      if (error) {
        return;
      }

      const line = text.text.trim();
      if (!line) {
        return;
      }

      const item = items.at(-1);
      if (!item) {
        error = `Invalid time line: ${line}`;
        return;
      }

      const regex = /(?<hour>\d{1,2}):(?<minute>\d{2})/;
      const match = line.match(regex);
      if (!match || !match.groups?.hour || !match.groups?.minute) {
        error = `Invalid time line: ${line}`;
        return;
      }

      const { hour, minute } = match.groups;
      item.stamp = new Date(
        item.stamp.getFullYear(),
        item.stamp.getMonth(),
        item.stamp.getDate(),
        +hour,
        +minute
      );
    },
  })
  .on("#homepage_tickets div.product.item.ticket span.ticket_name > a", {
    text(text) {
      if (error) {
        return;
      }

      const line = text.text.trim();
      if (!line) {
        return;
      }

      const item = items.at(-1);
      if (!item) {
        error = `Invalid title line: ${line}`;
        return;
      }

      item.title = line;
    },
  });

serve({
  routes: {
    "/": {
      GET: async () => {
        if (stamp.getTime() < Date.now() - 1000 * 60 * 60) {
          error = undefined;
          items.splice(0, items.length);
          stamp = new Date();

          const response = await fetch("https://obscure.cz/cs");
          htmlRewriter.transform(response);
        }

        return new Response(
          `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>Obscure</title>
    <description>${error ?? "Upcoming Obscure events"}</description>
    <link>https://obscure.cz/cs</link>
    <lastBuildDate>${stamp.toUTCString()}</lastBuildDate>
    <pubDate>${new Date().toUTCString()}</pubDate>
    ${items
      .map(
        (item) => `
    <item>
      <title>${item.title}</title>
      <description>${item.title}</description>
      <link>https://obscure.cz/cs</link>
      <pubDate>${item.stamp.toUTCString()}</pubDate>
    </item>`
      )
      .join("")}
  </channel>
</rss>
`,
          {
            headers: { "Content-Type": "application/rss+xml; charset=UTF-8" },
          }
        );
      },
    },
  },
});
