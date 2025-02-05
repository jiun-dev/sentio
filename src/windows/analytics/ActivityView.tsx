import React from "react";
import Color from "color";
import ActivityCalendar, { Day } from "react-activity-calendar";
import ReactTooltip from "react-tooltip";

import { Session } from "../../bindings/Session";
import useGlobal from "../../app/store";

interface Props {
  sessions: Session[];
  setDetailsView: (date: string) => void;
}

const ActivityView: React.FC<Props> = ({ sessions, setDetailsView }) => {
  const currentTheme = useGlobal((state) => state.currentTheme);

  const days = React.useMemo(() => {
    let days: Map<string, Day> = new Map();

    // sessions date range
    let dateRange = new Date();
    dateRange.setMonth(dateRange.getMonth() - 5);

    // transform sessions to appropriate Date objects
    for (let i = 0; i < sessions.length; i++) {
      let date = new Date(parseInt(sessions[i].finished_at));

      if (date.getTime() < dateRange.getTime()) continue;

      let iso_date = date.toISOString().split("T")[0];

      let day = days.get(iso_date);
      if (day) {
        day.count += sessions[i].duration / 60;
      } else {
        days.set(iso_date, {
          count: sessions[i].duration / 60,
          date: iso_date,
          level: 1,
        });
      }
    }

    // dummy objects needed in order to render graph properly
    let range_iso = dateRange.toISOString().split("T")[0];
    if (!days.has(range_iso)) {
      days.set(range_iso, { date: range_iso, count: 0, level: 0 });
    }
    let today_iso = new Date().toISOString().split("T")[0];
    if (!days.has(today_iso)) {
      days.set(today_iso, { date: today_iso, count: 0, level: 0 });
    }

    let days_array = Array.from(days.values());

    // level assigment based on hours spent
    // "count" equals "hours" in this case
    for (let i = 0; i < days_array.length; i++) {
      if (days_array[i].count >= 9) {
        days_array[i].level = 4;
      } else if (days_array[i].count >= 6) {
        days_array[i].level = 3;
      } else if (days_array[i].count >= 3) {
        days_array[i].level = 2;
      } else if (days_array[i].count > 0) {
        days_array[i].level = 1;
      } else {
        days_array[i].level = 0;
      }

      // needed for tooltip render
      days_array[i].count = parseFloat(days_array[i].count.toFixed(2));
    }
    return days_array;
  }, [sessions]);

  return days ? (
    <ActivityCalendar
      eventHandlers={{
        onClick: () => {
          return (data) => setDetailsView(data.date);
        },
      }}
      style={{ marginLeft: "auto", marginRight: "auto" }}
      theme={{
        level0: currentTheme?.base_hex!,
        level1: Color(currentTheme?.primary_hex).alpha(0.4).string(),
        level2: Color(currentTheme?.primary_hex).alpha(0.6).string(),
        level3: Color(currentTheme?.primary_hex).alpha(0.8).string(),
        level4: currentTheme?.primary_hex!,
      }}
      color={currentTheme?.primary_hex}
      data={days.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      )}
      labels={{
        legend: {
          less: "Less",
          more: "More",
        },
        months: [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ],
        tooltip: "<strong>Focused for {{count}}h</strong> on {{date}}",
        weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      }}
      hideTotalCount
    >
      <ReactTooltip html />
    </ActivityCalendar>
  ) : null;
};

export default ActivityView;
