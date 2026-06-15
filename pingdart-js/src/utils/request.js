import axios from "axios";

export const createClient = ({ apiKey, baseURL }) => {
    return axios.create({
        baseURL,
        headers: {
            "x-api-key": apiKey,
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
            "X-SDK-Source": "PingDart-Node-SDK"
        }
    });
};
