import React, { useCallback, useMemo } from "react";
import { FaDollarSign } from "react-icons/fa";
import { RootState } from "@/stores";
import { IStats } from "@/types";
import { useSelector } from "react-redux";
import { PieChart } from "react-minimal-pie-chart";
import { formatNumber } from "@/utils";

interface PieChartData {
  title: string;
  value: number;
  color: string;
  percentage: string;
}

const TrendStats = ({ data }: { data: IStats }) => {
  const btcPrice = useSelector(
    (state: RootState) => state.general.btc_price_in_dollar
  );

  const convertToUSD = useCallback(
    (sats: number) => {
      if (btcPrice) {
        return formatNumber(
          Number(((sats / 100_000_000) * btcPrice).toFixed(3))
        );
      }
      return "Loading...";
    },
    [btcPrice]
  );

  const convertSatsToUSD = (sats: number) => {
    return btcPrice ? (sats / 100_000_000) * btcPrice : 0;
  };

  const getRandomLightColor = () => {
    const hue = Math.floor(Math.random() * 360);
    const saturation = Math.floor(Math.random() * 26) + 74; // Range: 74-100
    const lightness = Math.floor(Math.random() * 26) + 60; // Adjusted Range: 60-85
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  const pieChartData = useMemo(() => {
    const totalAmt = data.aggregateVolume.reduce(
      (acc, item) => acc + convertSatsToUSD(item.totalAmt),
      0
    );

    let othersValue = 0;
    const processedData: PieChartData[] = data.aggregateVolume.reduce(
      (acc: PieChartData[], item) => {
        const itemValue = convertSatsToUSD(item.totalAmt);
        const percentage = (itemValue / totalAmt) * 100;

        if (percentage < 1) {
          othersValue += itemValue;
        } else {
          acc.push({
            title: item._id,
            value: percentage,
            color: getRandomLightColor(),
            percentage: percentage.toFixed(2) + "%",
          });
        }
        return acc;
      },
      []
    );

    if (othersValue > 0) {
      processedData.push({
        title: "Others",
        value: (othersValue / totalAmt) * 100,
        color: "#999999", // Assign a fixed color for 'Others'
        percentage: ((othersValue / totalAmt) * 100).toFixed(2) + "%",
      });
    }

    processedData.sort((a, b) => b.value - a.value);

    return processedData;
  }, [data.aggregateVolume, btcPrice]);

  return (
    <div className="py-8 px-6   rounded-lg bg-violet">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <FaDollarSign className="text-green-500" />
          <p className="pl-1">{convertToUSD(data.dailyVolume)}</p>
        </div>
        <div>
          <p>24Hr Volume</p>
        </div>
      </div>
      <div style={{ height: 200, width: "100%" }}>
        <PieChart
          data={pieChartData}
          //   label={({ dataEntry }) => dataEntry.percentage}
          //   labelStyle={{
          //     fontSize: '5px',
          //     fontFamily: 'sans-serif',
          //     fill: '#ffffff',
          //   }}
          //   labelPosition={112}
        />
      </div>
      <div className="legend pt-4 flex flex-wrap ">
        {pieChartData.map((entry, index) => (
          <div key={index} className="legend-item px-2 ">
            <span className="text-2xl" style={{ color: entry.color }}>
              ■
            </span>
            <span className="uppercase">
              {entry.title}: {entry.percentage}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrendStats;
