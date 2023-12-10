import dbConnect from "@/lib/dbConnect";
import { Inscription } from "@/models";
import { NextRequest, NextResponse } from "next/server";

function domain_format_validator(input: string) {
  // Check for leading and trailing whitespaces or newlines
  if (/^\s/u.test(input)) {
    return false;
  }

  // console.log({ input });
  // Convert to lowercase and trim whitespace
  input = input.toLowerCase().trim();

  // Check if content is a bitmap pattern (number followed by .bitmap)
  const bitmapPattern = /^\d+\.bitmap$/;
  if (bitmapPattern.test(input)) {
    return false;
  }

  // Check if input contains a period (to distinguish between name and namespace)
  const containsPeriod = (input.match(/\./g) || []).length === 1;

  if (containsPeriod) {
    // Validating as a name
    // Split the input at the first whitespace or newline
    // This is now removed since we handle leading and trailing spaces/newlines above
    // input = input.split(/\s|\n/)[0];

    // Validate that there is only one period in the name
    if ((input.match(/\./g) || []).length !== 1) {
      return false;
    }
  } else {
    return false;
  }

  // Validate UTF-8 characters (including emojis)
  // This regex allows letters, numbers, emojis, and some punctuation
  if (!/^[\p{L}\p{N}\p{P}\p{Emoji}]+$/u.test(input)) {
    return false;
  }

  return true;
}

async function checkDomainValid(domain: string) {
  const olderValidDomain = await Inscription.findOne({
    domain_name: domain,
    domain_valid: true,
  });
  return !olderValidDomain;
}
export async function GET(req: NextRequest) {
  await dbConnect();

  // const inscriptions = await Inscription.find({
  //   content: { $exists: true },
  //   tags: { $in: ["text", "json"] },
  //   domain_valid: { $exists: false },
  // })
  //   .select(
  //     "inscription_number content tags domain_name domain_valid inscription_id inscription_number"
  //   )

  //   .limit(10000)
  //   .sort({ inscription_number: -1 });
  // Find the inscriptions that match your criteria

  const inscriptions = await Inscription.find({
    tags: { $all: ["bitmap", "domain"] },
  })
    .select(
      "inscription_number content tags domain_name domain_valid inscription_id inscription_number"
    )

    .limit(10000);

  if (!inscriptions.length) {
    return NextResponse.json({ message: "All domains processed" });
  }

  // // Iterate over each inscription and update
  for (const inscription of inscriptions) {
    let isBitmap = false;
    // Check if content is a bitmap pattern (number followed by .bitmap)
    const bitmapPattern = /^\d+\.bitmap$/;
    if (bitmapPattern.test(inscription.content)) {
      isBitmap = true;
    }

    if (isBitmap) {
      // Remove "domain" tag if it exists
      inscription.tags = inscription.tags.filter(
        (tag: string) => tag !== "domain" && tag !== "token"
      );

      // Add "bitmap" to tags if it's not already present
      if (!inscription.tags.includes("bitmap")) {
        inscription.tags.push("bitmap");
      }

      // Set token field to false
      inscription.token = false;
      inscription.domain_valid = false;

      // Save the updated inscription
      await inscription.save();
    } else {
      console.log("confused");
    }
  }

  // // Iterate through each inscription and update domain_valid
  // for (const inscription of inscriptions) {
  //   if (inscription.content) {
  //     let name = null;
  //     try {
  //       name = JSON.parse(inscription.content.toString("utf-8"))?.name || null;
  //     } catch (err: any) {
  //       name = inscription.content;
  //     }
  //     if (name) {
  //       try {
  //         const patternValid = domain_format_validator(name);
  //         const isDomainValid = await checkDomainValid(name);
  //         // if domain pattern is valid
  //         if (patternValid) {
  //           // add domain name for all domains that have valid pattern
  //           inscription.domain_name = name.trim();
  //           // add domain tag only if its not already there
  //           if (!inscription.tags.includes("domain"))
  //             inscription.tags.push("domain");

  //           // domain_valid will be true only for domains that have valid pattern
  //           // and are valid (first time inscribed)
  //           // for others it will be false
  //           inscription.domain_valid = isDomainValid;
  //         } else {
  //           // If the domain is not valid pattern, remove the "domain" tag if it exists
  //           inscription.tags = inscription.tags.filter(
  //             (tag: string) => tag !== "domain"
  //           );
  //           // Optionally, clear the domain_name if it is not valid pattern
  //           // inscription.domain_name = null;

  //           // domain_valid will be true only for domains that have valid pattern
  //           // and are valid (first time inscribed)
  //           // for others it will be false
  //           inscription.domain_valid = false;

  //           // console.log({ inscription }, "INVALID CONTENT");
  //         }
  //       } catch (err: any) {
  //         // If the domain is not valid pattern, remove the "domain" tag if it exists
  //         inscription.tags = inscription.tags.filter(
  //           (tag: string) => tag !== "domain"
  //         );
  //         // Optionally, clear the domain_name if it is not valid pattern
  //         // inscription.domain_name = null;

  //         // domain_valid will be true only for domains that have valid pattern
  //         // and are valid (first time inscribed)
  //         // for others it will be false
  //         inscription.domain_valid = false;

  //         // console.log({ inscription }, "INVALID CONTENT");
  //       }
  //     } else {
  //       // If the domain is not valid pattern, remove the "domain" tag if it exists
  //       inscription.tags = inscription.tags.filter(
  //         (tag: string) => tag !== "domain"
  //       );
  //       // Optionally, clear the domain_name if it is not valid pattern
  //       // inscription.domain_name = null;

  //       // domain_valid will be true only for domains that have valid pattern
  //       // and are valid (first time inscribed)
  //       // for others it will be false
  //       inscription.domain_valid = false;

  //       // console.log({ inscription }, "INVALID CONTENT");
  //     }
  //   } else {
  //     // If the domain is not valid pattern, remove the "domain" tag if it exists
  //     inscription.tags = inscription.tags.filter(
  //       (tag: string) => tag !== "domain"
  //     );
  //     // Optionally, clear the domain_name if it is not valid pattern
  //     // inscription.domain_name = null;

  //     // domain_valid will be true only for domains that have valid pattern
  //     // and are valid (first time inscribed)
  //     // for others it will be false
  //     inscription.domain_valid = false;

  //     // console.log({ inscription }, "INVALID CONTENT");
  //   }
  //   await inscription.save(); // Save the updated inscription
  // }
  return NextResponse.json({
    processed: inscriptions.length,
    inscriptions,
  });
}

const resetInscription = async () => {
  try {
    // Update collections where supply is less than 1
    const result = await Inscription.updateMany(
      { domain_name: { $exists: true } }, // Query filter
      {
        $unset: { domain_valid: "", domain_name: "" }, // Remove 'official_collection'
      }
    );

    console.debug(
      `Successfully reset inscription. Updated count: ${result.modifiedCount}`
    );
  } catch (error) {
    console.error("Error resetting inscription:", error);
  }
};

export const dynamic = "force-dynamic";
