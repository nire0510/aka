# Scrippets

### Save and execute your favorite terminal scripts easily

Do you find yourself from time to time searching the web again and again for the command format of one of the dozens 
CLI tools out there? _then Search no more!_  
**Scrippets** is a simple CLI tool itself, which allows you to store your frequently used commands, assign a friendly
alias and execute it whenever needed. Those scrippets are stored locally on your file system, but can be easily shared
between your other workstations by changing the scrippet default directory to Dropbox, Google drive etc.

### Installation:
`npm install -g scrippets`

### Usage
`Usage: scrippets [options] [command]`

### Commands
* `upsert|set [options]`         add a new scrippet or update existing one    
* `list|ls [options] [filter]`   show all scrippets with optional filter  
* `remove|rm [options] [id...]`  remove a one or more scrippets  
* `execute|ex <id>`              execute a scrippet

### Options
`-h, --help`          output usage information  
`-V, --version`       output the version number  
`-C, --chdir <path>`  change the working directory  

### Tips
* Call any of the commands with `-h` parameter to see its help
* Assign a shorter alias to scrippet command (e.g. `alias sc=scrippets`)
* Change scrippets directory to Dropbox to have your scrippets on all of your workstations