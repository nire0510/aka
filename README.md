# AKA

###### Alias Bash Command on Steroids

A Bash `alias` is essentially nothing more than a keyboard shortcut, an abbreviation, 
a means of avoiding typing a long command sequence.  
It's because of these reasons that **AKA** provides a better alternative to the good ol' `alias` command:
- Aliases are stored as files on your file system and hence can be easily shared and synchronized between your computers
- AKA is cross-platform, which means it can be be used on your Linux, MacOS or Windows OS based machines
- It comes with some advance & handy features, such as: search, dynamic parameters and more

### Installation
`npm install -g as-known-as`

### Usage
`Usage: aka [options] [command]`

### Commands
* `<alias>=<command> [options]`         add a new alias or update existing one  
* `move|mv [options] <from> <to>`      rename an existing alias and/or update its description  
* `remove|rm [options] [alias...]`  remove a one or more aliases  
* `list|ls [options] [filter]`   show all aliases with optional filter  
* `execute|ex <alias>`              execute an alias

### Options
`-h, --help`          output usage information  
`-V, --version`       output the version number  
`-C, --chdir <path>`  change the working directory  

### Cues
* `<...>` - mandatory value
* `[...]` - optional value

### Examples
* `aka my-ip="dig +short myip.opendns.com @resolver1.opendns.com" -d "get my public ip address"` - adds a new **my-ip** alias
  with description. Description & command should be surrounded with quotes
* `aka ls ip` - searches for all aliases which contains **ip** in either alias or description
* `aka x my-ip` - execute **my-ip** alias (you can also omit the `x` if no options specified)
* `aka rm -rf` - removes all aliases
* `aka --chdir /Users/nir/Dropbox/aka` - changes **AKA** aliases directory

### Advanced Usage
1. **Dynamic command parameters** - Use command option -p to leave out parameters which you want to add dynamically, for example:  
`aka ls="ls -la" -d "display folder content as a list" ` and then use as follows:  
    `aka x ls -p "some-path"`
2. **Dynamic command parameters binding** - Use command option -b to flag a command with bind-able parameters.  
Parameters binding makes it even easier to execute aliases, by providing help and even set of valid options, for example:  
`aka scale-image="convert {{Source image path?|input}} -resize {{Scale rate (in percents)?|input}} {{Scaled image path?|input}}"
    -d "scale an image proportionally"`
     and then the use as follows:  
    `aka x scale-image`  

  Dynamic command parameters binding format:  
    - `{{description|type[|options]}}`  
    - **description** - short parameter description  
    - **type** - can be either `input` for free text, `list` for predefined list of valid options or `confirm` for
      specific value (see **options** for more info)  
    - **options**  
        - case `list` - semicolon separated list of strings, required only if type is `list`  
        - case `confirm` - a value which will be appended to the command in case of confirmation  
        - case `input` - default value
        
### Global Aliases
In addition to the aliases you yourself, there are global aliases which come built-in with this tool.  
To see those aliases or to execute them, add `-g` to the `ls` or `x` command respectively, for example:  
`aka ls -g` or `aka x zip`.

#### Adding Global Aliases
If you have an alias you find very useful, you can suggest adding it to the global aliases repository.  
To do this, clone the project, then add your alias to the **galiases** directory according to the example below:
```json
{
  "alias": "ll",
  "command": "ls -la",
  "description": "long listing",
  "timestamp": "2016-06-28T08:49:10.306Z",
  "credit": "you.email@domain.com"
}
```

### Tips & Tricks
* Call any of the commands with `-h` parameter to see its help
* Always use absolute paths (avoid shortcuts symbols such as ~, .. etc)
* You do not have to remember command's exact alias. If no command found with the exact alias, similar options
    will be displayed
* Change **AKA** aliases directory to Dropbox, Google Drive or any other online storage service, to share your aliases
    with all your workstations
* If you get **EACCES: permission denied** error on first run, either run as sudo (only once),
    or change your global `node_modules` directory to a path you have **write** access to
* If you get **Permission denied (publickey)** error while running ssh command, make sure your public key path is
absolute (i.e. do not start path with tilde ~)
* Notice that if a command contains pipes, it will run in EXEC mode, which basically means it's output is limited to 200KB