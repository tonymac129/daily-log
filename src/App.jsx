import { useEffect, useRef, useState } from "react";
import Day from "./components/Day";
import { reset, mode, importI, exportI } from "./assets/assets";
import { AnimatePresence, motion } from "framer-motion";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";

function App() {
  const [logging, setLogging] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editingInfo, setEditingInfo] = useState(null);
  const [log, setLog] = useState(localStorage.getItem("log") ? JSON.parse(localStorage.getItem("log")) : []);
  const [viewMode, setViewMode] = useState(localStorage.getItem("mode") ? JSON.parse(localStorage.getItem("mode")) : false);
  const [filteredLog, setFilteredLog] = useState(log);
  const [valid, setValid] = useState(true);
  const [search, setSearch] = useState("");
  const nameInputRef = useRef();
  const dateInputRef = useRef();
  const descriptionInputRef = useRef();
  const editNameInput = useRef();
  const editDescriptionInput = useRef();

  useEffect(() => {
    if (viewMode) {
      document.body.classList.add("light");
    } else {
      document.body.classList.remove("light");
    }
    localStorage.setItem("mode", viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (!logging) return;
    nameInputRef.current.focus();
    setTimeout(
      () =>
        flatpickr(dateInputRef.current, {
          dateFormat: "F d, Y",
          maxDate: "today",
          defaultDate: "today",
        }),
      100
    );
  }, [logging]);

  useEffect(() => {
    let searchTerm = search.trim().toLowerCase();
    setFilteredLog(
      log.filter((day) =>
        day.activities.some(
          (activity) =>
            activity.name.toLowerCase().includes(searchTerm) || activity.description.toLowerCase().includes(searchTerm)
        )
      )
    );
  }, [log, search]);

  useEffect(() => {
    localStorage.setItem("log", JSON.stringify(log));
  }, [log]);

  function addActivity() {
    let date = dateInputRef.current.value;
    let obj = {
      name: nameInputRef.current.value.trim(),
      description: descriptionInputRef.current.value.trim(),
    };
    if (!(date && obj.name)) {
      setValid(false);
      return;
    } else {
      setValid(true);
      setLogging(false);
    }
    let newActivity = { day: date, activities: [obj] };
    if (log.findIndex((day) => day.day === date) === -1) {
      setLog([...log, newActivity]);
    } else {
      let index = log.findIndex((day) => day.day === date);
      let newDay = {
        ...log[index],
        activities: [...log[index].activities, obj],
      };
      let newLog = [...log.slice(0, index), newDay, ...log.slice(index + 1)];
      setLog(newLog);
    }
  }

  function handleEditActivity(date, i) {
    setEditing(true);
    setEditingInfo({ date, i });
    const activity = log.find((day) => day.day === date).activities[i];
    setTimeout(() => {
      editNameInput.current.value = activity.name;
      editNameInput.current.focus();
      editDescriptionInput.current.value = activity.description;
    }, 10);
  }

  function editActivity() {
    let obj = {
      name: editNameInput.current.value.trim(),
      description: editDescriptionInput.current.value.trim(),
    };
    if (!obj.name) {
      setValid(false);
      return;
    } else {
      setValid(true);
      setEditing(false);
    }
    let index = log.findIndex((day) => day.day === editingInfo.date);
    let newActivities = [
      ...log[index].activities.slice(0, editingInfo.i),
      obj,
      ...log[index].activities.slice(editingInfo.i + 1),
    ];
    let newDay = {
      ...log[index],
      activities: newActivities,
    };
    let newLog = [...log.slice(0, index), newDay, ...log.slice(index + 1)];
    setLog(newLog);
  }

  function clearData() {
    if (confirm("Are you sure you want to delete your entire activity log? This action cannot be undone.")) {
      setLog([]);
      setFilteredLog([]);
    }
  }

  function exportData() {
    const dataStr = JSON.stringify(log, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "daily-log.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedLog = JSON.parse(event.target.result);
        if (Array.isArray(importedLog)) {
          setLog(importedLog);
        } else {
          alert("Invalid file format.");
        }
      } catch {
        alert("Could not parse file.");
      }
    };
    reader.readAsText(file);
  }

  return (
    <>
      <motion.div initial={{ y: 100 }} animate={{ y: 0 }} transition={{ duration: 0.6, type: "spring" }} className="wrap">
        <h1 className="title">Daily Activity Tracker</h1>
        <div className="log">
          <input
            type="text"
            placeholder="Search activities"
            autoComplete="off"
            className="search-activity"
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            value={search}
          />
          <button
            className="action-btn"
            onClick={() => {
              setLogging(true);
            }}
          >
            Add activity
          </button>
        </div>
        {[...filteredLog]
          .sort((a, b) => new Date(b.day) - new Date(a.day))
          .map((day, i) => {
            return (
              <Day
                key={i}
                date={day.day}
                activities={day.activities}
                log={log}
                setLog={setLog}
                editActivity={handleEditActivity}
              />
            );
          })}
        {log.length > 0 && filteredLog.length == 0 && (
          <p className="status">No activities matched the search query. Try again with another keyword!</p>
        )}
        {log.length == 0 && <p className="status">No logs added so far. Start logging by adding an activity above!</p>}
        <AnimatePresence mode="popLayout">
          {logging && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ y: "100vh", opacity: 0 }}
              transition={{ duration: 0.6, type: "spring" }}
              className="log-panel-bg"
              onClick={() => setLogging(false)}
            >
              <div className="log-panel" onClick={(e) => e.stopPropagation()}>
                <h2 className="panel-title">Log Activity</h2>
                <div className="panel-inputs">
                  <input
                    type="text"
                    placeholder="Activity name"
                    className="panel-input"
                    autoComplete="off"
                    ref={nameInputRef}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addActivity();
                    }}
                  />
                  <input type="text" placeholder="Activity time" className="panel-input" ref={dateInputRef} />
                  <textarea
                    placeholder="Activity description"
                    className="panel-input"
                    autoComplete="off"
                    ref={descriptionInputRef}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addActivity();
                    }}
                  />
                </div>
                {!valid && <p className="panel-warning">Invalid input, please try again</p>}
                <button className="action-btn" onClick={addActivity}>
                  Add activity
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence mode="popLayout">
          {editing && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ y: "100vh", opacity: 0 }}
              transition={{ duration: 0.6, type: "spring" }}
              className="log-panel-bg"
              onClick={() => setEditing(false)}
            >
              <div className="log-panel" onClick={(e) => e.stopPropagation()}>
                <h2 className="panel-title">Edit Activity</h2>
                <div className="panel-inputs">
                  <input
                    type="text"
                    placeholder="Activity name"
                    className="panel-input"
                    autoComplete="off"
                    ref={editNameInput}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") editActivity();
                    }}
                  />
                  <textarea
                    placeholder="Activity description"
                    className="panel-input"
                    autoComplete="off"
                    ref={editDescriptionInput}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") editActivity();
                    }}
                  />
                </div>
                {!valid && <p className="panel-warning">Invalid input, please try again</p>}
                <button className="action-btn" onClick={editActivity}>
                  Save edit
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <div className="fixed">
        <div className="top-icons">
          <motion.img
            src={mode}
            whileHover={{ rotate: 360, scale: 1.3 }}
            whileTap={{ rotate: 315 }}
            transition={{ duration: 0.8, type: "spring" }}
            onClick={() => setViewMode(!viewMode)}
            title="Toggle light mode"
          />
          <motion.img
            src={reset}
            whileHover={{ rotate: 360, scale: 1.3 }}
            whileTap={{ rotate: 315 }}
            transition={{ duration: 0.8, type: "spring" }}
            onClick={clearData}
            title="Clear data"
          />
          <label>
            <motion.img
              src={importI}
              whileHover={{ rotate: 360, scale: 1.3 }}
              whileTap={{ rotate: 315 }}
              transition={{ duration: 0.8, type: "spring" }}
              title="Import data"
            />
            <input type="file" accept="application/json" style={{ display: "none" }} onChange={importData} />
          </label>
          <motion.img
            src={exportI}
            whileHover={{ rotate: 360, scale: 1.3 }}
            whileTap={{ rotate: 315 }}
            transition={{ duration: 0.8, type: "spring" }}
            onClick={exportData}
            title="Export data"
          />
        </div>
        <div className="credits">
          &copy; 2025{" "}
          <a href="https://github.com/tonymac129/" target="_blank">
            TonyMac129
          </a>
        </div>
      </div>
    </>
  );
}

export default App;
