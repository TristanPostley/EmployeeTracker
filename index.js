const inquirer =  require("inquirer");
var mysql = require("mysql");
const cTable = require("console.table");

var connection = mysql.createConnection({
    host: "localhost",
    // Your port; if not 3306
    port: 3306,
    // Your username
    user: "root",
    // Your password
    password: "cl0cktower",
    database: "employee_db"
});

connection.connect(function(err) {
    if (err) throw err;
    start();
});

function start(){
    inquirer.prompt([
        {
            type: "list",
            message: "What would you like to do?",
            name: "input",
            choices: ["View all employees", "View roles", "View departments",
             "Add employee", "Add department", "Add role",
             "Delete employee", "Delete role", "Delete department",
             "Update employee role", "Update employee manager",
             "View total budget by department", "View employees by manager", "Exit"]
        }
    ])
    .then(cliResponse => {
        switch (cliResponse.input){
            case "View all employees":
                connection.query("SELECT * FROM employee", (err, res) => {
                    if(err) throw err;
                    console.log(" ");
                    console.table(res);
                    console.log(" ");
                });
                start();
                break;
            case "View roles":
                connection.query("SELECT * FROM role", (err, res) => {
                    if(err) throw err;
                    console.log(" ");
                    console.table(res);
                    console.log(" ");
                });
                start();
                break;
            case "View departments":
                connection.query("SELECT * FROM department", (err, res) => {
                    if(err) throw err;
                    console.log(" ");
                    console.table(res);
                    console.log(" ");
                });
                start();
                break;
            case "Add employee": 
                AddEmployee();
                break;
            case "Add role":
                AddRole();
                break;
            case "Add department":
                AddDepartment();
                break;
            case "Delete employee":
                DeleteEmployee();
                break;
            case "Delete role":
                DeleteRole();
                break;
            case "Delete department":
                DeleteDepartment();
                break;
            case "Update employee role":
                UpdateRole();
                break;
            case "Update employee manager":
                UpdateManager();
                break;
            case "View employees by manager":
                ViewByManager();
                break;
            case "View total budget by department":
                ViewBudget();
                break;
            case "Exit":
                connection.end();
                break;
        }
    })
}

function AddEmployee() {
    connection.query("SELECT * FROM employee RIGHT JOIN role ON employee.role_id = role.role_id", (err, res) => {
        if(err) throw err;
        console.table(res);
        inquirer.prompt([
            {
                type: "input",
                message: "What is the employee's first name?",
                name: "first"
            },
            {
                type: "input",
                message: "What is the employee's last name?",
                name: "last"
            },
            {
                type: "list",
                message: "What is the employee's role?",
                name: "role",
                choices: function() {
                    let roles = [];
                    res.forEach(element => {
                        roles.push(element.title);
                    })
                    let uniques = new Set(roles);
                    roles = [...uniques];
                    return roles;
                }
            },
            {
                type: "list",
                message: "Who is the employee's manager?",
                name: "manager",
                choices: function() {
                    let employees = [];
                    res.forEach(element => {
                        if(element.first_name !== null){
                            let name = element.first_name + " " + element.last_name;
                            employees.push(name);
                        }
                    });
                    employees.push("Nobody");
                    return employees;
                }
            }
        ])
            .then(cliResponse => {
                let role_id;
                let manager_id;
                res.forEach(element => {
                    if(element.title == cliResponse.role){
                        role_id = element.role_id;
                    }
                    if((element.first_name + " " + element.last_name) == cliResponse.manager){
                        manager_id = element.id;
                    }
                });
                if(!manager_id) manager_id = null;
                connection.query(`INSERT INTO employee(first_name, last_name, role_id, manager_id) VALUES ("${cliResponse.first}", "${cliResponse.last}", ${role_id}, ${manager_id})`, (err2, res2) => {
                    if(err2) throw err2;
                });
                start();
            })
    })
}

function AddRole(){
    connection.query("SELECT * FROM department", (err, res) => {
        if(err) throw err;
        inquirer.prompt([
            {
                type: "input",
                message: "What is the title of this role?",
                name: "title"
            },
            {
                type: "input",
                message: "What is the salary?",
                name: "salary"
            },
            {
                type: "list",
                message: "What department is this role in?",
                name: "department",
                choices: function() {
                    let departments = [];
                    res.forEach(element => departments.push(element.name));
                    return departments;
                }
            }
        ])
            .then(cliResponse => {
                let department_id;
                res.forEach(element => {
                    if(element.name == cliResponse.department){
                        department_id = element.id;   
                    }
                });

                connection.query(`INSERT INTO role(title, salary, department_id) VALUES ("${cliResponse.title}", ${cliResponse.salary}, ${department_id})`, (err2, res2) => {
                    if(err2) throw err2;
                });
                start();
            })
    })
}

function AddDepartment(){
    inquirer.prompt([
        {
            type: "input",
            message: "What is the name of this department?",
            name: "name"
        }
    ])
        .then(cliResponse => {
            connection.query(`INSERT INTO department(name) VALUES ("${cliResponse.name}")`, (err, res) => {
                if(err) throw err;
            });
            start();
        })
}

function UpdateRole(){
    connection.query("SELECT * FROM employee RIGHT JOIN role ON employee.role_id = role.role_id", (err, res) => {
        if(err) throw err;

        inquirer.prompt([
            {
                type: "list",
                message: "Which employee's role do you want to change?",
                name: "name",
                choices: function() {
                    let employees = [];
                    res.forEach(element => {
                        if(element.first_name !== null){
                            let name = element.first_name + " " + element.last_name;
                            employees.push(name);
                        }
                    });
                    employees.push("Nobody");
                    return employees;
                }
            }, 
            {
                type: "list",
                message: "What is their new role?",
                name: "role",
                choices: function() {
                    let roles = [];
                    res.forEach(element => roles.push(element.title));
                    let uniques = new Set(roles);
                    roles = [...uniques];
                    return roles;
                }
            }
        ])
        .then(cliResponse => {
            let role_id;
            res.forEach(element => {
                if(element.title == cliResponse.role){
                    role_id = element.role_id;
                }
            })
            let name = cliResponse.name.split(" ");
            connection.query(`UPDATE employee SET role_id = ${role_id} WHERE first_name = "${name[0]}" AND last_name = "${name[1]}"`, (err, res) => {
                if(err) throw err;
            });
            start();
        })
    })
}

function UpdateManager(){
    connection.query("SELECT * FROM employee RIGHT JOIN role ON employee.role_id = role.role_id", (err, res) => {
        if(err) throw err;

        inquirer.prompt([
            {
                type: "list",
                message: "Which employee's manager do you want to change?",
                name: "name",
                choices: function() {
                    let employees = [];
                    res.forEach(element => {
                        if(element.first_name !== null){
                            let name = element.first_name + " " + element.last_name;
                            employees.push(name);
                        }
                    });
                    employees.push("Nobody");
                    return employees;
                }
            }, 
            {
                type: "list",
                message: "Who is their new manager?",
                name: "manager",
                choices: function() {
                    let employees = [];
                    res.forEach(element => {
                        if(element.first_name !== null){
                            let name = element.first_name + " " + element.last_name;
                            employees.push(name);
                        }
                    });
                    employees.push("Nobody");
                    return employees;
                }
            }
        ])
        .then(cliResponse => {
            let manager_id;
            res.forEach(element => {
                if(element.first_name + " " + element.last_name == cliResponse.manager){
                    manager_id = element.id;
                }
            })
            if(!manager_id) manager_id = null;
            let name = cliResponse.name.split(" ");
            connection.query(`UPDATE employee SET manager_id = ${manager_id} WHERE first_name = "${name[0]}" AND last_name = "${name[1]}"`, (err, res) => {
                if(err) throw err;
            });
            start();
        })
    })
}

function DeleteEmployee(){
    connection.query("SELECT * FROM employee", (err, res) => {
        if(err) throw err;

        inquirer.prompt([
            {
                type: "list",
                message: "Which employee do you want to remove?",
                name: "name",
                choices: function() {
                    let employees = [];
                    res.forEach(element => {
                        if(element.first_name !== null){
                            let name = element.first_name + " " + element.last_name;
                            employees.push(name);
                        }
                    });
                    employees.push("Nobody");
                    return employees;
                }
            }
        ])
        .then(cliResponse => {
            let name = cliResponse.name.split(" ");
            connection.query(`DELETE FROM employee WHERE first_name = "${name[0]}" AND last_name = "${name[1]}"`, (err, res) => {
                if(err) throw err;
            });
            start();
        })
    })
}

function DeleteRole(){
    connection.query("SELECT * FROM role", (err, res) => {
        if(err) throw err;

        inquirer.prompt([
            {
                type: "list",
                message: "Which role do you want to remove?",
                name: "role",
                choices: function() {
                    let roles = [];
                    res.forEach(element => {
                        roles.push(element.title);
                    });
                    return roles;
                }
            }
        ])
        .then(cliResponse => {
            connection.query(`DELETE FROM role WHERE title = "${cliResponse.role}"`, (err, res) => {
                if(err) throw err;
            });
            start();
        })
    })
}

function DeleteDepartment(){
    connection.query("SELECT * FROM department", (err, res) => {
        if(err) throw err;

        inquirer.prompt([
            {
                type: "list",
                message: "Which department do you want to remove?",
                name: "department",
                choices: function() {
                    let departments = [];
                    res.forEach(element => {
                        departments.push(element.name);
                    });
                    return departments;
                }
            }
        ])
        .then(cliResponse => {
            connection.query(`DELETE FROM department WHERE name = "${cliResponse.department}"`, (err, res) => {
                if(err) throw err;
            });
            start();
        })
    })

}

function ViewByManager(){
    connection.query("SELECT * FROM employee", (err, res) => {
        if(err) throw err;

        inquirer.prompt([
            {
                type: "list",
                message: "Select an employee to view subordinates.",
                name: "name",
                choices: function() {
                    let employees = [];
                    res.forEach(element => {
                        if(element.first_name !== null){
                            let name = element.first_name + " " + element.last_name;
                            employees.push(name);
                        }
                    });
                    return employees;
                }
            }
        ])
            .then(cliResponse => {
                let manager_id;
                res.forEach(element => {
                    if(element.first_name + " " + element.last_name == cliResponse.name){
                        manager_id = element.id;
                    }
                })
                connection.query(`SELECT * FROM employee WHERE manager_id = ${manager_id}`, (err, res) => {
                    if(err) throw err;

                    console.log(" ");
                    console.table(res);
                    console.log(" ");
                })
                start();
            })
    })
}

function ViewBudget(){
    connection.query("SELECT * FROM department", (err, res) => {
        if(err) throw err;

        inquirer.prompt([
            {
                type: "list",
                message: "Which department's budget would you like to view?",
                name: "department",
                choices: function(){
                    let departments = [];
                    res.forEach(element => departments.push(element.name));
                    return departments;
                }
            }
        ])
            .then(cliResponse => {
                let department_id;
                res.forEach(element => {
                    if(element.name == cliResponse.department){
                        department_id = element.id;
                    }
                })
                connection.query(`SELECT * FROM role WHERE department_id = ${department_id}`, (err, res) => {
                    if(err) throw err;

                    let totalSalary = 0;
                    res.forEach(element => totalSalary += element.salary);
                    console.log("\n" + cliResponse.department + " total budget: " + totalSalary);
                })
                start();
            })
    })
}