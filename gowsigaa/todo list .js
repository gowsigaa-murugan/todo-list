document.addEventListener("DOMContentLoaded", () => {
    const taskInput = document.getElementById("taskInput");
    const addButton = document.getElementById("addButton");
    const taskList = document.getElementById("taskList");
    const filterButtons = document.querySelectorAll(".filter-btn");

    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let isEditing = false;
    let currentEditIndex = null;
    let currentFilter = "all";

    const renderTasks = () => {
        taskList.innerHTML = "";
        let filteredTasks = tasks;
        if (currentFilter === "completed") {
            filteredTasks = tasks.filter(task => task.completed);
        } else if (currentFilter === "incomplete") {
            filteredTasks = tasks.filter(task => !task.completed);
        }
        filteredTasks.forEach((task, index) => {
            const taskItem = document.createElement("li");
            taskItem.className = `task-item ${task.completed ? "completed" : ""}`;
            taskItem.innerHTML = `
                <div class="task-content">
                    <input type="checkbox" ${task.completed ? "checked" : ""} data-index="${index}">
                    <span>${task.name}</span>
                </div>
                <div class="task-buttons">
                    <button data-edit-index="${index}">Edit</button>
                    <button data-delete-index="${index}">Delete</button>
                </div>
            `;
            taskList.appendChild(taskItem);
        });
    };

    const addTask = () => {
        const taskName = taskInput.value.trim();
        if (taskName === "") {
            alert("Task cannot be empty");
            return;
        }
        if (tasks.some(task => task.name === taskName)) {
            alert("Task already exists");
            return;
        }
        tasks.unshift({ name: taskName, completed: false }); // Add task to the beginning
        localStorage.setItem('tasks', JSON.stringify(tasks));
        taskInput.value = "";
        renderTasks();
        showToast("Task added successfully");
    };

    const editTask = () => {
        const taskName = taskInput.value.trim();
        if (taskName === "") {
            alert("Task cannot be empty");
            return;
        }
        if (tasks.some((task, index) => task.name === taskName && index !== currentEditIndex)) {
            alert("Task already exists");
            return;
        }
        tasks[currentEditIndex].name = taskName;
        localStorage.setItem('tasks', JSON.stringify(tasks));
        taskInput.value = "";
        addButton.textContent = "Add";
        isEditing = false;
        currentEditIndex = null;
        renderTasks();
        showToast("Task updated successfully");
    };

    const deleteTask = (index) => {
        tasks.splice(index, 1);
        localStorage.setItem('tasks', JSON.stringify(tasks));
        renderTasks();
        showToast("Task deleted successfully");
    };

    const toggleTaskCompletion = (index) => {
        tasks[index].completed = !tasks[index].completed;
        localStorage.setItem('tasks', JSON.stringify(tasks));
        renderTasks();
        showToast(tasks[index].completed ? "Task marked as completed" : "Task marked as incomplete");
    };

    const showToast = (message) => {
        const toast = document.createElement("div");
        toast.className = "toast";
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.remove();
        }, 2000);
    };

    taskList.addEventListener("click", (e) => {
        if (e.target.tagName === "BUTTON") {
            const editIndex = e.target.getAttribute("data-edit-index");
            const deleteIndex = e.target.getAttribute("data-delete-index");
            if (editIndex !== null) {
                taskInput.value = tasks[editIndex].name;
                addButton.textContent = "Save";
                isEditing = true;
                currentEditIndex = editIndex;
            } else if (deleteIndex !== null) {
                confirmDelete(deleteIndex);
            }
        } else if (e.target.tagName === "INPUT") {
            const index = e.target.getAttribute("data-index");
            toggleTaskCompletion(index);
        }
    });

    const confirmDelete = (index) => {
        const confirmDialog = document.createElement("div");
        confirmDialog.className = "confirm-dialog";
        confirmDialog.innerHTML = `
            <p>Are you sure you want to delete the task: "${tasks[index].name}"?</p>
            <button id="yesButton">Yes</button>
            <button id="noButton">No</button>
        `;
        document.body.appendChild(confirmDialog);

        document.getElementById("yesButton").addEventListener("click", () => {
            deleteTask(index);
            document.body.removeChild(confirmDialog);
        });

        document.getElementById("noButton").addEventListener("click", () => {
            document.body.removeChild(confirmDialog);
        });
    };

    addButton.addEventListener("click", () => {
        if (isEditing) {
            editTask();
        } else {
            addTask();
        }
    });

    taskInput.addEventListener("keyup", (e) => {
        if (e.key === "Enter") {
            if (isEditing) {
                editTask();
            } else {
                addTask();
            }
        }
    });

    // Add event listeners for filter buttons
    filterButtons.forEach(button => {
        button.addEventListener("click", () => {
            currentFilter = button.dataset.filter;
            renderTasks();
        });
    });

    renderTasks(); // Render tasks initially when the DOM content is loaded
});
