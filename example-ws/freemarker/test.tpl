<!DOCTYPE HTML>
<html>
<head>
    <meta name="description" content="${meta.description!meta.title}">
    <title>${meta.title}</title>
</head>
<body>

<div>
    <#switch mod>
        <#case "list">
            <#include "list.html" encoding="UTF-8">
            <#break>
        <#case "view">
            <#include "view.html" encoding="UTF-8">
            <#break>
        <#default>
            <#include "list.html" encoding="UTF-8">
    </#switch>
</div>
</body>
</html>