   // State Management
      let tasks = JSON.parse(localStorage.getItem("advancedTasks")) || [];
      let currentFilter = "all";
      let searchQuery = "";
      let editingTaskId = null;

      // DOM Elements
      const themeToggle = document.getElementById("themeToggle");
      const addTaskBtn = document.getElementById("addTaskBtn");
      const modalOverlay = document.getElementById("modalOverlay");
      const modalClose = document.getElementById("modalClose");
      const modalCancel = document.getElementById("modalCancel");
      const taskForm = document.getElementById("taskForm");
      const tasksGrid = document.getElementById("tasksGrid");
      const searchInput = document.getElementById("searchInput");
      const filterBtns = document.querySelectorAll(".filter-btn");
      const modalTitle = document.getElementById("modalTitle");
      const modalSave = document.getElementById("modalSave");

      // Stats Elements
      const totalTasksEl = document.getElementById("totalTasks");
      const completedTasksEl = document.getElementById("completedTasks");
      const pendingTasksEl = document.getElementById("pendingTasks");
      const overdueTasksEl = document.getElementById("overdueTasks");

      // Theme Management
      function initTheme() {
        const savedTheme = localStorage.getItem("theme") || "light";
        document.body.setAttribute("data-theme", savedTheme);
        updateThemeIcon(savedTheme);
      }

      function updateThemeIcon(theme) {
        const icon = themeToggle.querySelector("i");
        icon.className = theme === "light" ? "fas fa-moon" : "fas fa-sun";
      }

      function toggleTheme() {
        const currentTheme = document.body.getAttribute("data-theme");
        const newTheme = currentTheme === "light" ? "dark" : "light";
        document.body.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);
        updateThemeIcon(newTheme);
      }

      // Modal Management
      function openModal(taskId = null) {
        editingTaskId = taskId;
        if (taskId) {
          const task = tasks.find((t) => t.id === taskId);
          modalTitle.textContent = "Edit Task";
          modalSave.textContent = "Update Task";
          document.getElementById("taskName").value = task.name;
          document.getElementById("taskDescription").value =
            task.description || "";
          document.getElementById("taskDate").value = task.dueDate || "";
          document.getElementById("taskPriority").value = task.priority;
          document.getElementById("taskCategory").value = task.category || "";
        } else {
          modalTitle.textContent = "Add New Task";
          modalSave.textContent = "Save Task";
          taskForm.reset();
          document.getElementById("taskPriority").value = "medium";
        }
        modalOverlay.classList.add("active");
        document.body.style.overflow = "hidden";
        // Focus on task name input
        setTimeout(() => document.getElementById("taskName").focus(), 100);
      }

      function closeModal() {
        modalOverlay.classList.remove("active");
        document.body.style.overflow = "";
        editingTaskId = null;
        taskForm.reset();
      }

      // Task Management
      function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
      }

      function saveTask(formData) {
        const taskData = {
          id: editingTaskId || generateId(),
          name: formData.get("taskName").trim(),
          description: formData.get("taskDescription").trim(),
          dueDate: formData.get("taskDate"),
          priority: formData.get("taskPriority"),
          category: formData.get("taskCategory").trim(),
          completed: editingTaskId
            ? tasks.find((t) => t.id === editingTaskId).completed
            : false,
          createdAt: editingTaskId
            ? tasks.find((t) => t.id === editingTaskId).createdAt
            : new Date().toISOString(),
          completedAt: editingTaskId
            ? tasks.find((t) => t.id === editingTaskId).completedAt
            : null,
        };

        if (editingTaskId) {
          const index = tasks.findIndex((t) => t.id === editingTaskId);
          tasks[index] = { ...tasks[index], ...taskData };
        } else {
          tasks.unshift(taskData);
        }

        saveToLocalStorage();
        renderTasks();
        closeModal();
        showNotification(
          editingTaskId
            ? "Task updated successfully!"
            : "Task added successfully!"
        );
      }

      function deleteTask(id) {
        if (confirm("Are you sure you want to delete this task?")) {
          tasks = tasks.filter((t) => t.id !== id);
          saveToLocalStorage();
          renderTasks();
          showNotification("Task deleted successfully!");
        }
      }

      function toggleTask(id) {
        const task = tasks.find((t) => t.id === id);
        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date().toISOString() : null;
        saveToLocalStorage();
        renderTasks();
        showNotification(
          task.completed ? "Task completed!" : "Task marked as pending!"
        );
      }

      function saveToLocalStorage() {
        localStorage.setItem("advancedTasks", JSON.stringify(tasks));
      }

      // Utility Functions
      function formatDate(dateString) {
        if (!dateString) return "";
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) {
          return "Today";
        } else if (date.toDateString() === tomorrow.toDateString()) {
          return "Tomorrow";
        } else {
          return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year:
              date.getFullYear() !== today.getFullYear()
                ? "numeric"
                : undefined,
          });
        }
      }

      function isOverdue(dateString) {
        if (!dateString) return false;
        const dueDate = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return dueDate < today;
      }

      function showNotification(message) {
        // Simple notification system
        const notification = document.createElement("div");
        notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--success);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: var(--radius);
        box-shadow: var(--shadow-lg);
        z-index: 10000;
        font-weight: 600;
        transition: var(--transition);
      `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
          notification.style.opacity = "0";
          notification.style.transform = "translateX(100%)";
          setTimeout(() => notification.remove(), 300);
        }, 3000);
      }

      // Filtering and Search
      function filterTasks(tasksToFilter) {
        let filtered = tasksToFilter.filter((task) => {
          // Search filter
          if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesSearch =
              task.name.toLowerCase().includes(query) ||
              (task.description &&
                task.description.toLowerCase().includes(query)) ||
              (task.category && task.category.toLowerCase().includes(query));
            if (!matchesSearch) return false;
          }

          // Status filter
          if (currentFilter === "completed") return task.completed;
          if (currentFilter === "pending") return !task.completed;
          if (currentFilter === "high") return task.priority === "high";
          if (currentFilter === "medium") return task.priority === "medium";
          if (currentFilter === "low") return task.priority === "low";

          return true;
        });

        // Sort tasks: pending first, then by priority, then by due date
        return filtered.sort((a, b) => {
          if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
          }

          const priorityOrder = { high: 3, medium: 2, low: 1 };
          if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[b.priority] - priorityOrder[a.priority];
          }

          if (a.dueDate && b.dueDate) {
            return new Date(a.dueDate) - new Date(b.dueDate);
          }
          if (a.dueDate) return -1;
          if (b.dueDate) return 1;

          return new Date(b.createdAt) - new Date(a.createdAt);
        });
      }

      function updateStats() {
        const total = tasks.length;
        const completed = tasks.filter((t) => t.completed).length;
        const pending = total - completed;
        const overdue = tasks.filter(
          (t) => !t.completed && isOverdue(t.dueDate)
        ).length;

        totalTasksEl.textContent = total;
        completedTasksEl.textContent = completed;
        pendingTasksEl.textContent = pending;
        overdueTasksEl.textContent = overdue;
      }

      function renderTasks() {
        const filteredTasks = filterTasks(tasks);
        updateStats();

        if (filteredTasks.length === 0) {
          tasksGrid.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-clipboard-list"></i>
            <h3>${
              tasks.length === 0 ? "No tasks yet" : "No tasks match your filter"
            }</h3>
            <p>${
              tasks.length === 0
                ? 'Click "Add New Task" to get started!'
                : "Try adjusting your search or filter."
            }</p>
          </div>
        `;
          return;
        }

        tasksGrid.innerHTML = filteredTasks
          .map(
            (task) => `
        <div class="task-card ${task.completed ? "completed" : ""}" data-id="${
              task.id
            }">
          <div class="task-header">
            <input type="checkbox" class="task-checkbox" ${
              task.completed ? "checked" : ""
            } 
                   onchange="toggleTask('${task.id}')">
            <div class="task-title">${task.name}</div>
            <div class="priority-badge priority-${task.priority}">${
              task.priority
            }</div>
          </div>
          ${
            task.description
              ? `<div class="task-description">${task.description}</div>`
              : ""
          }
          <div class="task-meta">
            ${
              task.dueDate
                ? `
              <span class="${
                isOverdue(task.dueDate) && !task.completed ? "overdue" : ""
              }">
                <i class="fas fa-calendar"></i> 
                ${formatDate(task.dueDate)}
                ${
                  isOverdue(task.dueDate) && !task.completed ? " (Overdue)" : ""
                }
              </span>
            `
                : ""
            }
            ${
              task.category
                ? `<span><i class="fas fa-tag"></i> ${task.category}</span>`
                : ""
            }
            <span><i class="fas fa-clock"></i> Created ${new Date(
              task.createdAt
            ).toLocaleDateString()}</span>
          </div>
          <div class="task-actions">
            <button class="task-btn edit" onclick="openModal('${
              task.id
            }')" title="Edit Task">
              <i class="fas fa-edit"></i>
            </button>
            <button class="task-btn delete" onclick="deleteTask('${
              task.id
            }')" title="Delete Task">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `
          )
          .join("");
      }

      // Event Listeners
      themeToggle.addEventListener("click", toggleTheme);
      addTaskBtn.addEventListener("click", () => openModal());
      modalClose.addEventListener("click", closeModal);
      modalCancel.addEventListener("click", closeModal);

      modalOverlay.addEventListener("click", (e) => {
        if (e.target === modalOverlay) closeModal();
      });

      taskForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const formData = new FormData(taskForm);
        if (formData.get("taskName").trim()) {
          saveTask(formData);
        }
      });

      searchInput.addEventListener("input", (e) => {
        searchQuery = e.target.value;
        renderTasks();
      });

      filterBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          filterBtns.forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          currentFilter = btn.dataset.filter;
          renderTasks();
        });
      });

      // Keyboard Shortcuts
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          closeModal();
        }
        if (e.ctrlKey && e.key === "k") {
          e.preventDefault();
          searchInput.focus();
        }
        if (e.ctrlKey && e.key === "n") {
          e.preventDefault();
          openModal();
        }
      });

      // Global Functions (for onclick handlers)
      window.toggleTask = toggleTask;
      window.deleteTask = deleteTask;
      window.openModal = openModal;

      // Initialize Application
      function initApp() {
        initTheme();
        renderTasks();

        // Set today's date as default for new tasks
        const today = new Date().toISOString().split("T")[0];
        document.getElementById("taskDate").setAttribute("min", today);
      }

      // Start the application
      initApp();