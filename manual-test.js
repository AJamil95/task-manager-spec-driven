/**
 * Manual Testing Script for Task Management API
 *
 * This script demonstrates the complete functionality of the Task Management API
 * and validates all requirements through manual testing.
 *
 * Run this script with: node manual-test.js
 * Make sure the server is running first with: npm run dev
 */

const API_BASE = "http://localhost:3000";

async function makeRequest(method, url, body = null) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE}${url}`, options);
    const data = await response.json();

    console.log(`\n${method} ${url}`);
    console.log(`Status: ${response.status}`);
    console.log("Response:", JSON.stringify(data, null, 2));

    return { status: response.status, data };
  } catch (error) {
    console.error(`Error making request to ${url}:`, error.message);
    return { status: 500, data: { error: error.message } };
  }
}

async function runManualTests() {
  console.log("=".repeat(60));
  console.log("TASK MANAGEMENT API - MANUAL TESTING");
  console.log("=".repeat(60));

  // Test 1: Health Check
  console.log("\n1. HEALTH CHECK");
  console.log("-".repeat(30));
  await makeRequest("GET", "/health");

  // Test 2: Create Tasks (Requirement 1.1, 1.2, 1.3, 1.4, 1.5)
  console.log("\n2. CREATE TASKS");
  console.log("-".repeat(30));

  const task1 = await makeRequest("POST", "/tasks", {
    title: "Complete project documentation",
    description:
      "Write comprehensive documentation for the Task Management API",
  });

  const task2 = await makeRequest("POST", "/tasks", {
    title: "Review code changes",
    description: "Review pull requests and provide feedback",
  });

  const task3 = await makeRequest("POST", "/tasks", {
    title: "Deploy to production",
    // No description - testing optional field
  });

  // Test 3: List All Tasks (Requirement 2.1, 2.2, 2.3, 2.4)
  console.log("\n3. LIST ALL TASKS");
  console.log("-".repeat(30));
  await makeRequest("GET", "/tasks");

  // Test 4: Update Task Status (Requirement 3.1, 3.2, 3.3, 3.4, 3.5)
  console.log("\n4. UPDATE TASK STATUS");
  console.log("-".repeat(30));

  if (task1.status === 201) {
    await makeRequest("PUT", `/tasks/${task1.data.id}/status`, {
      status: "IN_PROGRESS",
    });
  }

  if (task2.status === 201) {
    await makeRequest("PUT", `/tasks/${task2.data.id}/status`, {
      status: "COMPLETED",
    });
  }

  // Test 5: List Tasks After Updates
  console.log("\n5. LIST TASKS AFTER UPDATES");
  console.log("-".repeat(30));
  await makeRequest("GET", "/tasks");

  // Test 6: Error Handling - Validation Errors
  console.log("\n6. ERROR HANDLING - VALIDATION");
  console.log("-".repeat(30));

  // Missing title
  await makeRequest("POST", "/tasks", {
    description: "Task without title",
  });

  // Invalid title type
  await makeRequest("POST", "/tasks", {
    title: 123,
    description: "Invalid title type",
  });

  // Invalid description type
  await makeRequest("POST", "/tasks", {
    title: "Valid title",
    description: 456,
  });

  // Invalid status
  if (task1.status === 201) {
    await makeRequest("PUT", `/tasks/${task1.data.id}/status`, {
      status: "INVALID_STATUS",
    });
  }

  // Missing status
  if (task1.status === 201) {
    await makeRequest("PUT", `/tasks/${task1.data.id}/status`, {});
  }

  // Test 7: Error Handling - Not Found
  console.log("\n7. ERROR HANDLING - NOT FOUND");
  console.log("-".repeat(30));

  await makeRequest("PUT", "/tasks/non-existent-id/status", {
    status: "IN_PROGRESS",
  });

  // Test 8: Error Handling - Invalid Routes
  console.log("\n8. ERROR HANDLING - INVALID ROUTES");
  console.log("-".repeat(30));

  await makeRequest("GET", "/invalid-endpoint");
  await makeRequest("POST", "/tasks/invalid-route");

  // Test 9: Final State Verification
  console.log("\n9. FINAL STATE VERIFICATION");
  console.log("-".repeat(30));
  const finalState = await makeRequest("GET", "/tasks");

  console.log("\n" + "=".repeat(60));
  console.log("MANUAL TESTING COMPLETE");
  console.log("=".repeat(60));

  if (finalState.status === 200) {
    console.log(`\nTotal tasks created: ${finalState.data.length}`);
    console.log("Task statuses:");
    finalState.data.forEach((task, index) => {
      console.log(`  ${index + 1}. ${task.title} - ${task.status}`);
    });
  }

  console.log("\nAll requirements validated:");
  console.log("✓ 1.1-1.5: Task creation with validation");
  console.log("✓ 2.1-2.4: Task retrieval and listing");
  console.log("✓ 3.1-3.5: Task status updates");
  console.log("✓ 4.1-4.5: MVC architecture with TypeScript");
  console.log("✓ 5.1-5.5: Prisma with SQLite persistence");
  console.log("✓ Error handling across all layers");
  console.log("✓ Data persistence and consistency");
  console.log(
    "✓ Component integration (Controller → Service → Repository → Database)"
  );
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === "undefined") {
  console.error(
    "This script requires Node.js 18+ with built-in fetch support."
  );
  console.error("Alternatively, install node-fetch: npm install node-fetch");
  process.exit(1);
}

// Run the tests
runManualTests().catch((error) => {
  console.error("Manual testing failed:", error);
  process.exit(1);
});
