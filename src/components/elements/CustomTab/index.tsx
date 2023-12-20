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
      sx={{ backgroundColor: "transparent", borderBottom: 0 }}
    >
      {tabsData.map((tab, index) => {
        const isActive = currentTab === tab.value;
        console.log({ isActive });
        return (
          <Tab
            key={index}
            label={tab.label}
            value={tab.value}
            disabled={tab.disabled}
            sx={{
              padding: "8px 16px",
              backgroundColor: isActive ? "#9102F0" : "#a8a4a4",
              color: "#fff",
              opacity: tab.disabled ? 0.5 : 1,
              cursor: tab.disabled ? "not-allowed" : "pointer",
              "&:hover": {
                backgroundColor: isActive ? "" : "#3d0263",
              },
            }}
          />
        );
      })}
    </Tabs>
  );
};

export default CustomTab;
