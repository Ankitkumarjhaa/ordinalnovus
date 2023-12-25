import React from "react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";

interface CustomTabProps {
  tabsData: Array<{
    label: string;
    value: any;
    disabled?: boolean;
  }>;
  currentTab: any;
  onTabChange: (event: React.ChangeEvent<{}>, newValue: any) => void;
}

const CustomTab = ({ tabsData, currentTab, onTabChange }: CustomTabProps) => {
  return (
    <Tabs
      value={currentTab}
      onChange={onTabChange}
      sx={{
        backgroundColor: "transparent",
        borderBottom: 0,
        ".MuiTabs-indicator": {
          // Hide the underline indicator
          display: "none",
        },
      }}
    >
      {tabsData.map((tab, index) => {
        const isActive = currentTab === tab.value;
        return (
          <Tab
            key={index}
            label={tab.label}
            value={tab.value}
            disabled={tab.disabled || isActive}
            sx={{
              "&.Mui-selected": {
                color: "#fff",
              },
              padding: "8px 16px",
              margin: "0 4px",
              borderRadius: "4px",
              backgroundColor: isActive ? "#9102F0" : "#4d4d4d",
              color: isActive ? "#fff" : "#fff", // White text for active and inactive tabs
              boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
              textTransform: "uppercase",
              // fontWeight: "bold",
              opacity: tab.disabled ? 0.5 : 1,
              cursor: tab.disabled ? "not-allowed" : "pointer",
              "&:hover": {
                backgroundColor: isActive ? "" : "#8e8e8e",
              },
            }}
          />
        );
      })}
    </Tabs>
  );
};

export default CustomTab;
