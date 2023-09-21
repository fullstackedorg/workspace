NL_ARGS.forEach(arg => {
    if(arg.startsWith("URL="))
        window.location.href = arg.split("=").pop();
})
