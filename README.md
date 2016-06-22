# Scrippets

### Save and execute your favorite terminal scripts easily

Do you find yourself searching the web again and again for the command format of one of the dozens 
CLI tools out there? _then search no more!_  
**Scrippets** is a simple CLI tool itself, which allows you to store your frequently used commands
locally on your file system, assign a friendly alias and execute whenever needed.

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

### Cues
* `<...>` - mandatory value
* `[...]` - optional value

### Tips
* Call any of the commands with `-h` parameter to see its help
* Assign a shorter alias to scrippet command (e.g. `alias sc=scrippets`)
* Change scrippets directory to Dropbox, Google Drive or other online storage service, to have your scrippets on all 
of your workstations