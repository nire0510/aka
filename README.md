# Scrippets

###### Save and execute your favorite terminal scripts easily

Do you find yourself searching the web again and again for the command format of one of the dozens 
CLI tools out there? _then search no more!_  
**Scrippets** is a simple CLI tool itself, which allows you to store your frequently used commands
locally on your file system, assign a friendly alias and execute whenever needed.

### Installation
`npm install -g scrippets`

### Usage
`Usage: scrippets [options] [command]`

### Commands
* `upsert|set [options]`         add a new scrippet or update existing one  
* `move|mv [options] <from> <to>`      rename a scrippet and optionally update its description
* `remove|rm [options] [name...]`  remove a one or more scrippets  
* `list|ls [options] [filter]`   show all scrippets with optional filter  
* `execute|x <name>`              execute a scrippet

### Options
`-h, --help`          output usage information  
`-V, --version`       output the version number  
`-C, --chdir <path>`  change the working directory  

### Cues
* `<...>` - mandatory value
* `[...]` - optional value

### Examples
* `scrippets upsert "curl -s checkip.dyndns.org | sed -e 's/.*Current IP Address: //' -e 's/<.*$//'" 
  -n my-ip -d "get my public ip address"` - adds a new scrippet
  with predefined name **my-ip** and description
* `scrippets ls ip` - searches for all scrippets which contains bash in their name or description
* `scrippets x my-ip` - execute a scrippet with name **compile-bash**
* `scrippets rm -rf` - removes all scrippets
* `scrippets --chdir /Users/nir/Dropbox/scrippets` - changes scrippets directory to `/Users/nir/Dropbox/scrippets`

### Tips & Tricks
* If you get **EACCES: permission denied** error on first run, either change your global `node_modules` directory
to a path you have **write** access to, or run `sudo scrippets` (you need to do it only once)
* Call any of the commands with `-h` parameter to see its help
* Assign a shorter alias to scrippet command (e.g. `alias sc=scrippets`)
* You do not have to remember the command exact name. If no scrippets with the exact name found, similar options
will be displayed so you can choose
* Change scrippets directory to Dropbox, Google Drive or other online storage service, to have your scrippets on all 
of your workstations
* If you get **Permission denied (publickey)** error while running ssh scrippet, make sure your public key path is
absolute (i.e. do not start path with tilde ~)