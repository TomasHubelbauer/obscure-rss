import { expect, test } from "bun:test";
if (!process.env.LIVE_SITE) {
  await import("./index");
}

test("returns items", async () => {
  const response = await fetch(
    process.env.LIVE_SITE ?? "http://localhost:3000"
  );

  expect(response.status).toBe(200);

  let titleCount = 0;

  let title = "";
  let description = "";
  let pubDate = "";

  let titleSeen = false;
  let descriptionSeen = false;
  let lastBuildDateSeen = false;
  let pubDateSeen = false;

  const rewriter = new HTMLRewriter()
    .on("channel > title", {
      text(text) {
        if (!text.text) {
          return;
        }

        expect(text.text).not.toBeEmpty();
        titleSeen = true;
      },
    })
    .on("channel > description", {
      text(text) {
        if (!text.text) {
          return;
        }

        expect(text.text).not.toBeEmpty();
        descriptionSeen = true;
      },
    })
    .on("channel > lastBuildDate", {
      text(text) {
        if (!text.text) {
          return;
        }

        expect(text.text).not.toBeEmpty();
        lastBuildDateSeen = true;
      },
    })
    .on("channel > pubDate", {
      text(text) {
        if (!text.text) {
          return;
        }

        expect(text.text).not.toBeEmpty();
        pubDateSeen = true;
      },
    })
    .on("item > title", {
      text(text) {
        if (!text.text) {
          return;
        }

        titleCount += 1;
        title = text.text;
      },
    })
    .on("item > description", {
      text(text) {
        if (!text.text) {
          return;
        }

        description = text.text;
      },
    })
    .on("item > pubDate", {
      text(text) {
        if (!text.text) {
          return;
        }

        pubDate = text.text;
      },
    });

  await rewriter.transform(response).text();

  expect(titleSeen).toBe(true);
  expect(descriptionSeen).toBe(true);
  expect(lastBuildDateSeen).toBe(true);
  expect(pubDateSeen).toBe(true);
  expect(titleCount).toBeGreaterThan(0);
  expect(title).not.toBeEmpty();
  expect(description).not.toBeEmpty();
  expect(pubDate).not.toBeEmpty();
});
