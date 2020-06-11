"use strict";

import { APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";
import { isDefined } from "../common/support";
import axios from "axios";
import { stat } from "fs";

export const autocomplete: APIGatewayProxyHandler = async (event) => {
  if (!isDefined(event.queryStringParameters.input)) {
    return { statusCode: 500, body: "No query parameter input" };
  }
  if (!isDefined(event.queryStringParameters.session)) {
    return { statusCode: 500, body: "No query parameter session" };
  }

  let response: APIGatewayProxyResult;
  await axios
    .get(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${event.queryStringParameters.input}&key=${process.env.INSPECT_NEXT_PLACES_KEY}&type=(cities)&sessiontoken=${event.queryStringParameters.session}`
    )
    .then((res) => {
      response = {
        statusCode: res.status,
        body: JSON.stringify(res.data),
      };
    });

  return response;
};

export const getFiveDay: APIGatewayProxyHandler = async (
  event
): Promise<APIGatewayProxyResult> => {
  if (!isDefined(event.queryStringParameters.address)) {
    return {
      statusCode: 500,
      body: "No query parameter address",
    };
  }
  if (!isDefined(event.queryStringParameters.units)) {
    return {
      statusCode: 500,
      body: "No query parameter units",
    };
  }
  let response;
  await axios
    .get(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${event.queryStringParameters.address}&key=${process.env.INSPECT_NEXT_GEOCODING_KEY}`
    )
    .then(async ({ status, data }) => {
      if (status === 200) {
        response = await getAutoComplete(
          data.results[0].geometry.location.lat,
          data.results[0].geometry.location.lng,
          event.queryStringParameters.units
        );
      } else {
        response = { statusCode: status, body: JSON.stringify(data) };
      }
    });

  return response;
};

const getAutoComplete: any = async (
  lat: string | number,
  lon: string | number,
  units: string
): Promise<APIGatewayProxyResult> => {
  let response;
  await axios
    .get(
      `http://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${process.env.INSPECT_NEXT_WEATHER_KEY}&units=${units}`
    )
    .then((res): void => {
      response = {
        statusCode: res.status,
        body: JSON.stringify(res.data),
      };
    });
  return response;
};

export const getLocation: APIGatewayProxyHandler = async (event) => {
  if (!isDefined(event.queryStringParameters.lat)) {
    return {
      statusCode: 500,
      body: "No query parameter lat",
    };
  }
  if (!isDefined(event.queryStringParameters.lon)) {
    return {
      statusCode: 500,
      body: "No query parameter lon",
    };
  }
  let response;
  await axios
    .get(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${event.queryStringParameters.lat},${event.queryStringParameters.lon}&key=${process.env.INSPECT_NEXT_GEOCODING_KEY}&result_type=locality`
    )
    .then(({ data, status }): void => {
      response = {
        statusCode: status,
        body:
          status === 200
            ? data.results[0].formatted_address
            : JSON.stringify(data),
      };
    });

  return response;
};
