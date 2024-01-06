import { IStats } from "@/types";
import axios from "axios";

const fetchStats = async (): Promise<IStats | null> => {
  try {
    const response = await axios.get<IStats>("http://localhost:3000/api/v2/stats");
    return response.data;
    console.log(response.data, 'statsapi')
  } catch (error) {
    console.error("Error fetching stats:", error);
    return null;
  }
};

export default fetchStats;
