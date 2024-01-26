import React, { useCallback, useMemo } from "react";
import { FaBitcoin, FaDollarSign } from "react-icons/fa";
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
    const lightness = Math.floor(Math.random() * 21) + 40; // Adjusted Range: 40-60
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };
  const baseHue = 276; // Hue for #9102F0
  const themeColors = [
    "#9102F0", // Base Purple
    "#6A4BF0", // Blue-Violet
    "#C42FF0", // Red-Violet
    "#BDA6F8", // Lighter Purple
    "#5E00A3", // Darker Purple
    "#8C7DF7", // Lighter Blue-Violet
    "#4A31C4", // Darker Blue-Violet
    "#DA8CF7", // Lighter Red-Violet
    "#9E1BC4", // Darker Red-Violet
    // Additional colors can be added as needed
  ];
  

  const pieChartData = useMemo(() => {
    const totalAmt = data.aggregateVolume.reduce(
      (acc, item) => acc + convertSatsToUSD(item.totalAmt),
      0
    );

    let othersValue = 0;
    const processedData: PieChartData[] = data.aggregateVolume.reduce(
      (acc: PieChartData[], item, index) => {
        const itemValue = convertSatsToUSD(item.totalAmt);
        const percentage = (itemValue / totalAmt) * 100;

        if (percentage < 1) {
          othersValue += itemValue;
        } else {
          const colorIndex = index % themeColors.length;
          acc.push({
            title: item._id,
            value: percentage,
            color: themeColors[colorIndex],
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
  }, [data.aggregateVolume, btcPrice, themeColors]);

  return (
    <div className="py-8 px-6   rounded-lg h-full">
      <div>
        <p>24Hr Volume ( Ordinalnovus )</p>
      </div>
      <div className="flex pt-2 justify-between items-center">
        <div>
          <div className="flex items-center">
            <FaDollarSign className="text-green-500" />
            <p className="pl-1">{convertToUSD(data.dailyVolume)}</p>
          </div>
          <div className="pt-1">
            <div className="flex items-center">
              <FaBitcoin className="text-bitcoin" />
              <p className="pl-1">
                {(data.dailyVolume / 100_000_000).toFixed(3)}
              </p>
            </div>
          </div>
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
