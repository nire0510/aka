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
* `upsert|set [options] <command>`         add a new scrippet or update existing one  
* `move|mv [options] <from> <to>`      rename a scrippet and optionally update its description
* `remove|rm [options] [alias...]`  remove a one or more scrippets  
* `list|ls [options] [filter]`   show all scrippets with optional filter  
* `execute|x <alias>`              execute a scrippet

### Options
`-h, --help`          output usage information  
`-V, --version`       output the version number  
`-C, --chdir <path>`  change the working directory  

### Cues
* `<...>` - mandatory value
* `[...]` - optional value

### Examples
* `scrippets upsert -a my-ip -d "get my public ip address" "curl http://ifconfig.me/ip"` - adds a new scrippet
  with predefined alias **my-ip** and description. Description & command should be surrounded with quotes
* `scrippets ls ip` - searches for all scrippets which contains **ip** in their alias or description
* `scrippets x my-ip` - execute a scrippet with alias **my-ip** (you can also omit the `x` if no options specified)
* `scrippets rm -rf` - removes all scrippets
* `scrippets --chdir /Users/nir/Dropbox/scrippets` - changes scrippets directory to `/Users/nir/Dropbox/scrippets`

### Advanced Usage
1. **Dynamic command parameters** - Use command option -p to leave out parameters which you want to add dynamically, for example:  
`scrippets set -a ls -d "display folder content as a list" "ls -la"` and the usage is as follows:  
`scrippets x ls -p "some-path"`
2. **Dynamic command parameters binding** - Use command option -b to flag a command with bind-able parameters.  
Parameters binding allow makes it even more easier to execute commands, by providing help and even set of valid options, for example:  
`scrippets set -a scale-image -d "scale an image proportionally"
    "convert {{Source image path?|input}} -resize {{Scale rate (in percents)?|input}} {{Scaled image path?|input}}""`
     and the usage is as follows:  
    `scrippets x scale-image -b`  

  Dynamic command parameters binding format:
    - `{{description|type[|options]}}`
    - **description** - short parameter description to display to the user who runs this command
    - **type** - can be either `input` for free text or `list` for predefined list of valid options
    - **options** - semicolon separated list of strings, required only if type is `list`

### Tips & Tricks
* Call any of the commands with `-h` parameter to see its help
* Always use absolute paths  (avoid shortcuts symbols such as ~, .. etc)
* Assign a shorter alias to `scrippets` command (e.g. `alias sc=scrippets`)
* You do not have to remember the command's exact alias. If no scrippets found with the exact alias, similar options
will be displayed
* Change scrippets directory to Dropbox, Google Drive or other online storage service, to have your scrippets on all 
of your workstations
* If you get **EACCES: permission denied** error on first run, either run as sudo (only once),
or change your global `node_modules` directory to a path you have **write** access to
* If you get **Permission denied (publickey)** error while running ssh scrippet, make sure your public key path is
absolute (i.e. do not start path with tilde ~)