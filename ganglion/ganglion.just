project := justfile_directory()
dir := env("GANGLION_DIR", source_directory())
name := env("GANGLION_NAME", file_name(project))

[doc("Show the variables, external/ and the link; plugged with mod ganglion \"ganglion/ganglion.just\"")]
[script("bash")]
status vault=env("OBSIDIAN_VAULT", ""):
    set -uo pipefail
    vault={{ quote(vault) }} dir={{ quote(dir) }} name={{ quote(name) }}
    external_of() {
        local s
        s=$(sed -n 's/^external:[[:space:]]*"\{0,1\}\([^"]*\)"\{0,1\}[[:space:]]*$/\1/p' "$1/ganglions.yaml" 2>/dev/null | head -n1)
        [[ $s == /* ]] || s=$(realpath "$1")/${s:-../external}
        realpath -m "$s"
    }
    register() {
        local file=$1/.ganglions.yaml names
        names=$({ sed -n 's/^  - "\{0,1\}\([^"]*\)"\{0,1\}$/\1/p' "$file" 2>/dev/null; if [[ $2 == add ]]; then echo "$3"; fi; } | { grep -vxF -- "$([[ $2 == remove ]] && echo "$3")" || true; } | LC_ALL=C sort -u)
        { echo "# Confirmed ganglions of this external/, one per line."
          if [[ -z $names ]]; then echo "ganglions: []"; else echo "ganglions:"; sed 's/^/  - /' <<<"$names"; fi
        } >"$file"
    }
    if [[ -t 1 && -z ${NO_COLOR:-} ]]; then
        key=$'\e[36m' val=$'\e[1m' ok=$'\e[32m' warn=$'\e[33m' bad=$'\e[31m' dim=$'\e[2m' off=$'\e[0m'
    else
        key= val= ok= warn= bad= dim= off=
    fi
    origin() { [[ -n ${!1:-} ]] && printf '%senv%s' "$dim" "$off" || printf '%sdefault%s' "$dim" "$off"; }
    row() { printf '  %s%-15s%s %s%s%s  %s\n' "$key" "$1" "$off" "$val" "$2" "$off" "$3"; }
    from=
    if [[ -n $vault && $vault == "${OBSIDIAN_VAULT:-}" ]]; then from=$(origin OBSIDIAN_VAULT)
    elif [[ -n $vault ]]; then from="${dim}arg${off}"; fi
    row OBSIDIAN_VAULT "${vault:-unset}" "$from"
    row GANGLION_NAME "$name" "$(origin GANGLION_NAME)"
    row GANGLION_DIR "$dir" "$(origin GANGLION_DIR)"
    [[ -f $dir/ganglion.yaml ]] || printf '  %sno ganglion.yaml in %s%s\n' "$warn" "$dir" "$off"
    if [[ -z $vault ]]; then
        printf '  %sexport OBSIDIAN_VAULT=<vault> (in .envrc with direnv, or your shell); a plain assignment is not exported.%s\n' "$bad" "$off"
        exit 1
    fi
    [[ -d $vault ]] || { printf '  %sno vault at %s%s\n' "$bad" "$vault" "$off"; exit 1; }
    link=$(external_of "$vault")/$name
    row external "$(dirname "$link")" ""
    if [[ -L $link && ! -e $link ]]; then
        row link "$link" "${bad}broken: $(readlink "$link"), run just ganglion install${off}"
    elif [[ -L $link && $(realpath "$link") == "$(realpath "$dir")" ]]; then
        row link "$link" "${ok}installed${off}"
    elif [[ -L $link ]]; then
        row link "$link" "${warn}points to $(readlink "$link")${off}"
    elif [[ -e $link ]]; then
        row link "$link" "${bad}not a link${off}"
    else
        row link "$link" "${warn}not installed${off}"
    fi
    if grep -qxF -- "  - $name" "$(dirname "$link")/.ganglions.yaml" 2>/dev/null; then
        row register "$(dirname "$link")/.ganglions.yaml" "${ok}confirmed${off}"
    else
        row register "$(dirname "$link")/.ganglions.yaml" "${warn}not confirmed${off}"
    fi

[doc("Link the ganglion into external/, confirm it there, track it in the vault")]
[script("bash")]
install vault=env("OBSIDIAN_VAULT", ""):
    set -euo pipefail
    vault={{ quote(vault) }} dir={{ quote(dir) }} name={{ quote(name) }}
    external_of() {
        local s
        s=$(sed -n 's/^external:[[:space:]]*"\{0,1\}\([^"]*\)"\{0,1\}[[:space:]]*$/\1/p' "$1/ganglions.yaml" 2>/dev/null | head -n1)
        [[ $s == /* ]] || s=$(realpath "$1")/${s:-../external}
        realpath -m "$s"
    }
    register() {
        local file=$1/.ganglions.yaml names
        names=$({ sed -n 's/^  - "\{0,1\}\([^"]*\)"\{0,1\}$/\1/p' "$file" 2>/dev/null; if [[ $2 == add ]]; then echo "$3"; fi; } | { grep -vxF -- "$([[ $2 == remove ]] && echo "$3")" || true; } | LC_ALL=C sort -u)
        { echo "# Confirmed ganglions of this external/, one per line."
          if [[ -z $names ]]; then echo "ganglions: []"; else echo "ganglions:"; sed 's/^/  - /' <<<"$names"; fi
        } >"$file"
    }
    track() {
        local file=$1/ganglions.yaml
        grep -qE "^  - name: \"?$(sed 's/[][\.*^$+?(){}|/]/\\&/g' <<<"$2")\"?[[:space:]]*$" "$file" 2>/dev/null && return 1
        if [[ ! -f $file ]]; then
            printf '# Ganglions this vault tracks: see the Ganglion standard.\nganglions:\n  - name: %s\n' "$2" >"$file"
        elif grep -qE '^ganglions:[[:space:]]*\[\][[:space:]]*$' "$file"; then
            sed -i "s/^ganglions:[[:space:]]*\[\][[:space:]]*$/ganglions:\n  - name: $2/" "$file"
        elif grep -qE '^ganglions:[[:space:]]*$' "$file"; then
            sed -i "/^ganglions:[[:space:]]*$/a\\  - name: $2" "$file"
        else
            printf 'ganglions:\n  - name: %s\n' "$2" >>"$file"
        fi
    }
    [[ -n $vault ]] || { echo "export OBSIDIAN_VAULT=<vault> (in .envrc with direnv, or your shell), or pass the vault path." >&2; exit 1; }
    [[ -d $vault ]] || { echo "No vault at $vault" >&2; exit 1; }
    [[ -d $dir ]] || { echo "No ganglion folder at $dir" >&2; exit 1; }
    external=$(external_of "$vault")
    mkdir -p "$external"
    ln -sfn "$(realpath "$dir")" "$external/$name"
    register "$external" add "$name"
    echo "$external/$name -> $(realpath "$dir"), confirmed"
    if track "$vault" "$name"; then echo "$vault/ganglions.yaml: $name tracked"; else echo "$vault/ganglions.yaml: $name already tracked"; fi

[doc("Remove the ganglion's link and confirmation from external/")]
[script("bash")]
uninstall vault=env("OBSIDIAN_VAULT", ""):
    set -euo pipefail
    vault={{ quote(vault) }} name={{ quote(name) }}
    external_of() {
        local s
        s=$(sed -n 's/^external:[[:space:]]*"\{0,1\}\([^"]*\)"\{0,1\}[[:space:]]*$/\1/p' "$1/ganglions.yaml" 2>/dev/null | head -n1)
        [[ $s == /* ]] || s=$(realpath "$1")/${s:-../external}
        realpath -m "$s"
    }
    register() {
        local file=$1/.ganglions.yaml names
        names=$({ sed -n 's/^  - "\{0,1\}\([^"]*\)"\{0,1\}$/\1/p' "$file" 2>/dev/null; if [[ $2 == add ]]; then echo "$3"; fi; } | { grep -vxF -- "$([[ $2 == remove ]] && echo "$3")" || true; } | LC_ALL=C sort -u)
        { echo "# Confirmed ganglions of this external/, one per line."
          if [[ -z $names ]]; then echo "ganglions: []"; else echo "ganglions:"; sed 's/^/  - /' <<<"$names"; fi
        } >"$file"
    }
    [[ -n $vault ]] || { echo "export OBSIDIAN_VAULT=<vault>, or pass the vault path." >&2; exit 1; }
    external=$(external_of "$vault")
    link=$external/$name
    if [[ -L $link ]]; then rm "$link" && echo "removed $link"; else echo "nothing at $link"; fi
    [[ -f $external/.ganglions.yaml ]] && register "$external" remove "$name"
