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

        if (filteredTasks.length === 0) {
            const noTasksMessage = document.createElement("li");
            noTasksMessage.className = "no-tasks-message";
            noTasksMessage.textContent = "No tasks available.";
            taskList.appendChild(noTasksMessage);
        } else {
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
        }

        updateTaskCounts(); // Update task counts whenever tasks are rendered
        highlightActiveFilterButton(); // Highlight active filter button

        // Scroll to top of task list after rendering tasks
        scrollToTop();
    };

    const addTask = () => {
        const taskName = taskInput.value.trim().toLowerCase().replace(/\s+/g, ' ');
        if (taskName === "") {
            showToast("Task cannot be empty and special characters are not allowed");
            taskInput.focus();
            return;
        }
        if (tasks.some(task => task.name.toLowerCase() === taskName)) {
            showToast("Task already exists");
            taskInput.focus();
            return;
        }
        tasks.unshift({ name: taskName, completed: false }); // Add task to the beginning
        localStorage.setItem('tasks', JSON.stringify(tasks));
        taskInput.value = "";
        renderTasks();
        showToast("Task added successfully");
        toggleAddButton();
        currentFilter = "all"; // Switch filter to "all"
        applyCurrentFilter(); // Apply filter
    };

    const editTask = () => {
        const taskName = taskInput.value.trim();
        if (taskName === "") {
            showToast("Task cannot be empty");
            taskInput.focus();
            return;
        }
        if (taskName !== tasks[currentEditIndex].name.toLowerCase() && tasks.some((task, index) => task.name.toLowerCase() === taskName.toLowerCase() && index !== currentEditIndex)) {
            showToast("Task already exists");
            taskInput.focus();
            return;
        }
        const editedTask = tasks.splice(currentEditIndex, 1)[0]; // Remove the task from its current position
        editedTask.name = taskName;
        tasks.unshift(editedTask); // Add the edited task at the beginning
        localStorage.setItem('tasks', JSON.stringify(tasks));
        taskInput.value = "";
        addButton.textContent = "Add"; // Reset button text to "Add"
        isEditing = false;
        currentEditIndex = null;
        applyCurrentFilter(); // Apply current filter to show the edited task
        showToast("Task updated successfully");
        toggleAddButton();
        taskInput.focus(); // Set focus back to the task input after updating

        // Scroll to top of task list after editing task
        scrollToTop();
    };

    const deleteTask = (index) => {
        // Check if the task being deleted is the one currently being edited
        if (isEditing && currentEditIndex == index) {
            isEditing = false;
            currentEditIndex = null;
            taskInput.value = "";
            addButton.textContent = "Add"; // Reset button text to "Add"
        }
        tasks.splice(index, 1);
        localStorage.setItem('tasks', JSON.stringify(tasks));
        renderTasks();
        showToast("Task deleted successfully");

        // Scroll to top of task list after deleting task
        scrollToTop();
    };

    const toggleTaskCompletion = (index) => {
        const task = tasks[index];
        const originalCompletedState = task.completed; // Store the original completion state
        const checkbox = document.querySelector(`input[data-index="${index}"]`);

        // Temporarily toggle the checkbox state to reflect the user's action
        checkbox.checked = !originalCompletedState;

        const confirmDialog = document.createElement("div");
        confirmDialog.className = "confirm-dialog";
        confirmDialog.innerHTML = `
            <p>Do you want to mark "${task.name}" as ${originalCompletedState ? "incomplete" : "completed"}?</p>
            <button id="yesButton">Yes</button>
            <button id="noButton">No</button>
        `;
        document.body.appendChild(confirmDialog);

        document.getElementById("yesButton").addEventListener("click", () => {
            task.completed = !originalCompletedState;
            localStorage.setItem('tasks', JSON.stringify(tasks));
            document.body.removeChild(confirmDialog);
            renderTasks();
            showToast(task.completed ? "Task marked as completed" : "Task marked as incomplete");
            if (task.completed) {
                currentFilter = "completed"; // Switch filter to "completed"
            } else {
                currentFilter = "all"; // Switch filter to "all"
            }
            applyCurrentFilter(); // Apply filter

            // Scroll to top of task list after marking task as completed/incomplete
            scrollToTop();
        });

        document.getElementById("noButton").addEventListener("click", () => {
            document.body.removeChild(confirmDialog);
            checkbox.checked = originalCompletedState; // Revert to the original state if "No" is clicked
        });
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

    const toggleAddButton = () => {
        addButton.disabled = taskInput.value.trim() === "";
    };

    const handleInput = (e) => {
        let value = e.target.value;
        value = value.replace(/^\s+/g, ''); // Remove leading whitespace

        // Check for special characters and show toast if found
        if (/[^a-zA-Z0-9\s]/.test(value)) {
            showToast("Special characters are not allowed");
            value = value.replace(/[^a-zA-Z0-9\s]/g, ''); // Remove special characters
        }

        e.target.value = value;
        toggleAddButton();
    };

    const applyCurrentFilter = () => {
        switch (currentFilter) {
            case 'completed':
                filterTasks('completed');
                break;
            case 'incomplete':
                filterTasks('incomplete');
                break;
            default:
                filterTasks('all');
        }
    };

    const filterTasks = (filter) => {
        currentFilter = filter;
        renderTasks();
        highlightActiveFilterButton(); // Ensure active filter button is highlighted
    };

    const highlightActiveFilterButton = () => {
        filterButtons.forEach(button => {
            if (button.getAttribute("data-filter") === currentFilter) {
                button.classList.add("active");
            } else {
                button.classList.remove("active");
            }
        });
    };

    taskList.addEventListener("click", (e) => {
        if (e.target.tagName === "BUTTON") {
            const editIndex = e.target.getAttribute("data-edit-index");
            const deleteIndex = e.target.getAttribute("data-delete-index");
            if (editIndex !== null) {
                currentFilter = "all"; // Switch filter to "all" for editing
                applyCurrentFilter(); // Apply filter
                taskInput.value = tasks[editIndex].name;
                addButton.textContent = "Save";
                isEditing = true;
                currentEditIndex = editIndex;
                toggleAddButton();
                taskInput.focus(); // Set focus when editing a task
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
            <p>Are you sure you want to delete the task? "${tasks[index].name}"</p>
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

    taskInput.addEventListener("input", handleInput);

    taskInput.addEventListener("keyup", (e) => {
        if (e.key === "Enter") {
            if (isEditing) {
                editTask();
            } else {
                addTask();
            }
        }
    });

    // Filter buttons event listeners
    filterButtons.forEach(button => {
        button.addEventListener("click", () => {
            const filter = button.getAttribute("data-filter");
            filterTasks(filter);
        });
    });

    const updateTaskCounts = () => {
        const allTaskCount = tasks.length;
        const completedTaskCount = tasks.filter(task => task.completed).length;
        const incompleteTaskCount = allTaskCount - completedTaskCount;

        document.getElementById("allTaskCount").textContent = allTaskCount;
        document.getElementById("completedTaskCount").textContent = completedTaskCount;
        document.getElementById("incompleteTaskCount").textContent = incompleteTaskCount;
    };

    // Function to scroll to the top of the task list
    const scrollToTop = () => {
        taskList.scrollTop = 0;
    };

    // Call updateTaskCounts initially and whenever tasks are rendered or modified
    updateTaskCounts();

    // Initial render
    renderTasks();
});


