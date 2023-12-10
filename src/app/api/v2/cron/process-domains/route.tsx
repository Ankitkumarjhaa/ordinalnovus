import dbConnect from "@/lib/dbConnect";
import { Inscription } from "@/models";
import { NextRequest, NextResponse } from "next/server";

async function checkDomainValid(domain: string) {
  const olderValidDomain = await Inscription.findOne({
    domain_name: domain,
    domain_valid: true,
  });
  return !olderValidDomain;
}
export async function GET(req: NextRequest) {
  await dbConnect();

  const inscriptions = await Inscription.find({
    content: { $exists: true },
    tags: { $in: ["text", "json"] },
    domain_valid: { $exists: false },
  })
    .select(
      "inscription_number content tags domain_name domain_valid inscription_id inscription_number"
    )

    .limit(10000)
    .sort({ inscription_number: -1 });

  // Find the inscriptions that match your criteria

  if (!inscriptions.length) {
    return NextResponse.json({ message: "All domains processed" });
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
