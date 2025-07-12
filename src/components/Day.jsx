import { useEffect, useState } from "react";
import { edit, trash } from "../assets/assets";
import { AnimatePresence, motion } from "framer-motion";

function Day({ date, activities, log, setLog, editActivity }) {
  const [activityList, setActivityList] = useState(activities);

  useEffect(() => {
    let index = log.findIndex((day) => day.day === date);
    if (activityList.length == 0) {
      setLog([...log.slice(0, index), ...log.slice(index + 1)]);
      return;
    }
    let newDay = {
      ...log[index],
      activities: activityList,
    };
    setLog([...log.slice(0, index), newDay, ...log.slice(index + 1)]);
  }, [activityList]);

  useEffect(() => {
    setActivityList(activities);
  }, [activities]);

  function deleteActivity(i) {
    setActivityList(activityList.filter((_, index) => index !== i));
  }

  return (
    <div className="day">
      <div className="date">{date}</div>
      <motion.div className="activities" layout>
        <AnimatePresence mode="sync">
          {activityList.map((activity, i) => {
            return (
              <motion.div
                className="activity"
                key={i}
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
              >
                <div className="activity-content">
                  <div className="activity-name">{activity.name}</div>
                  {activity.description}
                </div>
                <div className="activity-icons">
                  <img src={edit} title="Edit activity" onClick={() => editActivity(date, i)} />
                  <img src={trash} title="Delete activity" onClick={() => deleteActivity(i)} />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default Day;
