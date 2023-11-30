import { Model, Schema, Types } from "mongoose";

interface FinalQuery {
  find: Record<string, unknown>;
  where: Record<string, unknown>;
  sort: Record<string, number>;
  start: number;
  limit: number;
  show: string;
  match: string;
}

/**
 * Converts input params into a mongoose query object
 * @param {Model} model - Mongoose model
 * @param {Object} params - Query parameters to convert
 * @returns {FinalQuery} finalQuery - Mongoose query object
 */

function convertParams(
  model: Model<any>,
  params: Record<string, any>
): FinalQuery {
  const schemaKeys = Object.keys(model.schema.obj);
  const queryKeys = Object.keys(params).filter((key) => params[key]);

  const finalQuery: FinalQuery = {
    find: {},
    where: {},
    sort: {},
    start: 0,
    limit: 10,
    show: "prune",
    match: "exact",
  };

  queryKeys.forEach((key) => {
    if (key.includes("_sort")) {
      processSortParam(finalQuery, params[key]);
    } else if (key.includes("_start")) {
      finalQuery.start = parseInt(params[key]);
    } else if (key.includes("_limit")) {
      finalQuery.limit = parseInt(params[key]);
    } else if (key.includes("show")) {
      finalQuery.show = params[key].split(",").join(" ");
    } else if (key.includes("match")) {
      if (params.match === "regex") {
        if (params.content && params.content_type) {
          finalQuery.find.$text = { $search: `\"${params.content}\"` };
          finalQuery.find.content_type = params.content_type;
        } else if (params.content) {
          finalQuery.find.$text = { $search: `\"${params.content}\"` };
        } else if (params.name) {
          finalQuery.find.$text = { $search: `\"${params.name}\"` };
          finalQuery.find.name = { $exists: true };
        }
        // If other fields like content_type, sha, or sat_name are required, handle them here as well
      }
    } else if (key !== "match" && !params.match) {
      // Exclude 'match' from processing in else condition
      processWhereParam(
        finalQuery,
        model,
        schemaKeys,
        key,
        params[key],
        params
      );
    }
  });

  processNumberRangeParam(finalQuery, params);

  console.log(finalQuery, "Final query");
  return finalQuery;
}

function processSortParam(finalQuery: FinalQuery, sortParam: string): void {
  const [sortField, sortOrder] = sortParam.split(":");
  finalQuery.sort = { [sortField]: Number(sortOrder) };
}

function processWhereParam(
  finalQuery: FinalQuery,
  model: Model<any>,
  schemaKeys: string[],
  key: string,
  value: any,
  params: any
): void {
  if (
    params.match === "text" &&
    (key === "content" ||
      key === "content_type" ||
      key === "sha" ||
      key === "sat_name")
  ) {
    finalQuery.find.$text = { $search: value };
  } else if (schemaKeys.includes(key)) {
    if (key === "officialCollection" || key === "list") {
      finalQuery.find[key] = new Types.ObjectId(value);
    } else if (key === "name") {
      finalQuery.find[key] = new RegExp(value, "i"); // 'i' flag for case-insensitive matching
    } else {
      const isObjectId = model.schema.obj[key]?.valueType === "ObjectId";
      finalQuery.find[key] = isObjectId ? new Types.ObjectId(value) : value;
    }
  } else {
    processWhereParamWithOptions(finalQuery, key, value);
  }
}

function processNumberRangeParam(
  finalQuery: FinalQuery,
  params: Record<string, any>
): void {
  const { minNumber, maxNumber } = params;

  if (minNumber && maxNumber) {
    finalQuery.find.number = {
      $gte: parseInt(minNumber),
      $lte: parseInt(maxNumber),
    };
  } else if (minNumber) {
    finalQuery.find.number = { $gte: parseInt(minNumber) };
  } else if (maxNumber) {
    finalQuery.find.number = { $lte: parseInt(maxNumber) };
  }
}

function processWhereParamWithOptions(
  finalQuery: FinalQuery,
  key: string,
  value: any
): void {
  const queryOptions = ["_ne", "_lt", "_gt", "_lte", "_gte"];

  queryOptions.forEach((option) => {
    if (key.includes(option)) {
      const mongoOperator = option.replace("_", "$");
      const field = key.replace(option, "");

      if (!finalQuery.find[field]) {
        finalQuery.find[field] = {};
      }

      finalQuery.find[field][mongoOperator] = value;
    }
  });
}

export default convertParams;
