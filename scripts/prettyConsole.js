const prettyConsole = () => {
  if (typeof window?.console?.log === "function") {
    window.console.pretty = (...logs) => {
      let prettylogs = [];
      logs.forEach((log) => {
        if (typeof log !== "string") {
          prettylogs.push(log);
          return;
        }
        let css = [];
        let keywords = {
          "error": "color:red;",
          "warn": "color:orange;",
          "warning": "color:orange;",
          "success": "color:green;",
          "info": "color:cyan;",
          "debug": "color:gray;",

          "label-error": "display:inline-block;color:red;background-color:#F003;padding:0 4px;border-radius:4px;border:1px solid currentColor;",
          "label-warn": "display:inline-block;color:orange;background-color:#ffa50033;padding:0 4px;border-radius:4px;border:1px solid currentColor;",
          "label-warning": "display:inline-block;color:orange;background-color:#ffa50033;padding:0 4px;border-radius:4px;border:1px solid currentColor;",
          "label-success": "display:inline-block;color:green;background-color:#0F01;padding:0 4px;border-radius:4px;border:1px solid currentColor;",
          "label-info": "display:inline-block;color:cyan;background-color:#00F3;padding:0 4px;border-radius:4px;border:1px solid currentColor;",
          "label-debug": "display:inline-block;color:gray;background-color:#333;padding:0 4px;border-radius:4px;border:1px solid currentColor;",

          "bold": "font-weight:bold;",
          "italic": "font-style:italic;",
          "underline": "text-decoration:underline;",
          "overline": "text-decoration:overline;",
          "line-through": "text-decoration:line-through;",

          "uppercase": "text-transform:uppercase;",
          "lowercase": "text-transform:lowercase;",
          "capitalize": "text-transform:capitalize;",
        }
        log = log.replace(/\[[^:]*:[^\]]*\]/ig, (match) => {
          let [argument,...text] = match.replace(/\[|\]/g, "").split(":");
          text = text.join(":");

          let cssText = "";
          argument.split(",").forEach((keyword) => {
            if (keywords[keyword]) {
              cssText += keywords[keyword];
            } else {
              cssText += "color:" + keyword + ";";
            }
          });

          css.push(cssText);
          css.push("");

          return "%c"+text+"%c";
        });
        prettylogs.push(log, ...css);
      });
      window.console.log(...prettylogs);
    }
  }
  return true;
}
prettyConsole();