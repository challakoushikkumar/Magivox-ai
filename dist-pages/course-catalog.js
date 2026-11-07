export const COURSES = Object.freeze([
  {
    "id": "excel",
    "icon": "XL",
    "title": "Excel for Data Analysis",
    "category": "Data",
    "level": "Beginner",
    "pdf": "resources/Excel_A_to_Z_MAGIVOX.pdf",
    "description": "Formulas, lookups, cleaning, PivotTables, Power Query and dashboards.",
    "topics": [
      {
        "title": "Excel foundation & references",
        "summary": "Workbooks contain worksheets made of cells and ranges; formulas use relative, absolute and mixed references.",
        "keywords": [
          "cell",
          "range",
          "formula",
          "relative",
          "absolute"
        ],
        "useCase": "Use structured sheets and correct references before building analysis.",
        "workflow": "Set data types -> create formula -> copy/fill -> verify references.",
        "mistake": "Copying a formula without locking a required reference.",
        "check": "Check a few filled rows and confirm the referenced cells are correct.",
        "example": "=B2*$F$1 keeps the tax rate fixed while B2 changes."
      },
      {
        "title": "Functions, lookups & dates",
        "summary": "Core functions combine logic, aggregation, lookup, text cleaning and date handling.",
        "keywords": [
          "IF",
          "SUMIFS",
          "XLOOKUP",
          "INDEX MATCH",
          "date"
        ],
        "useCase": "Use formulas to transform raw rows into reliable business fields.",
        "workflow": "Define the required result -> choose function -> test one row -> handle errors -> fill down.",
        "mistake": "Using approximate lookup when an exact match is required.",
        "check": "Test known IDs, blanks and edge cases before trusting totals.",
        "example": "XLOOKUP can return a product name from a ProductID."
      },
      {
        "title": "Cleaning, validation & dynamic arrays",
        "summary": "Excel Tables, validation, FILTER, SORT and UNIQUE make clean, controlled datasets easier to analyse.",
        "keywords": [
          "Table",
          "validation",
          "FILTER",
          "SORT",
          "UNIQUE"
        ],
        "useCase": "Use these tools to standardise data and prevent avoidable entry errors.",
        "workflow": "Convert to Table -> inspect blanks/duplicates -> standardise -> validate -> recheck.",
        "mistake": "Deleting values before confirming whether they are genuine duplicates.",
        "check": "Compare row counts and totals before and after cleaning.",
        "example": "UNIQUE can create a distinct city list for a dropdown."
      },
      {
        "title": "PivotTables & Power Query",
        "summary": "PivotTables summarise data quickly; Power Query imports, cleans, merges and appends repeatable datasets.",
        "keywords": [
          "PivotTable",
          "Power Query",
          "merge",
          "append",
          "slicer"
        ],
        "useCase": "Use PivotTables for summary and Power Query for repeatable ETL.",
        "workflow": "Load data -> clean/query -> create PivotTable -> add fields -> verify aggregation -> add slicer.",
        "mistake": "Using Count when the business question requires Sum.",
        "check": "Compare Pivot totals with a validated source total.",
        "example": "City in Rows and Revenue in Values gives city-wise revenue."
      },
      {
        "title": "Charts, dashboard & interview readiness",
        "summary": "A dashboard combines clear KPIs, appropriate charts, filters and a consistent story.",
        "keywords": [
          "KPI",
          "chart",
          "dashboard",
          "conditional formatting",
          "slicer"
        ],
        "useCase": "Use dashboards to answer a small set of business questions at a glance.",
        "workflow": "Define KPIs -> choose visual -> build -> add filters -> test interactions -> simplify.",
        "mistake": "Choosing a chart because it looks attractive rather than because it answers the question.",
        "check": "Verify every KPI and test filters before presentation.",
        "example": "Cards for Sales/Profit plus a bar chart by city and slicer by product."
      }
    ]
  },
  {
    "id": "sql",
    "icon": "SQL",
    "title": "SQL for Data Analysis",
    "category": "Data",
    "level": "Beginner",
    "pdf": "resources/SQL_A_to_Z_MAGIVOX.pdf",
    "description": "SELECT, filtering, aggregation, joins, CTEs, windows and business analysis.",
    "topics": [
      {
        "title": "Database foundation & SELECT",
        "summary": "SQL retrieves columns and rows from relational tables using SELECT and FROM.",
        "keywords": [
          "database",
          "table",
          "SELECT",
          "column",
          "row"
        ],
        "useCase": "Use SELECT to inspect data and return only fields needed for a question.",
        "workflow": "Identify table -> choose columns -> write SELECT -> run -> inspect result.",
        "mistake": "Using SELECT * everywhere and returning unnecessary data.",
        "check": "Confirm row count and selected columns match the question.",
        "example": "SELECT Name, Salary FROM Employees;"
      },
      {
        "title": "Filtering, functions & CASE",
        "summary": "WHERE filters rows; functions and CASE transform or classify values.",
        "keywords": [
          "WHERE",
          "NULL",
          "CASE",
          "AND",
          "OR"
        ],
        "useCase": "Use filters and expressions to focus on relevant records and derive categories.",
        "workflow": "Define condition -> handle NULL -> combine conditions carefully -> test boundary values.",
        "mistake": "Writing = NULL instead of IS NULL.",
        "check": "Check boundary rows and parenthesise mixed AND/OR conditions.",
        "example": "CASE WHEN Salary >= 50000 THEN 'High' ELSE 'Standard' END."
      },
      {
        "title": "Aggregation, GROUP BY & HAVING",
        "summary": "Aggregate functions summarise rows; GROUP BY sets the grouping level and HAVING filters groups.",
        "keywords": [
          "SUM",
          "COUNT",
          "AVG",
          "GROUP BY",
          "HAVING"
        ],
        "useCase": "Use aggregation for totals, averages and category summaries.",
        "workflow": "Choose grouping -> aggregate measure -> GROUP BY dimensions -> HAVING if needed.",
        "mistake": "Selecting a non-aggregated column that is not in GROUP BY.",
        "check": "Compare grand total with grouped totals where appropriate.",
        "example": "SELECT City, SUM(Sales) FROM Orders GROUP BY City;"
      },
      {
        "title": "Joins, subqueries & CTEs",
        "summary": "Joins combine related tables; subqueries and CTEs break complex logic into understandable steps.",
        "keywords": [
          "INNER JOIN",
          "LEFT JOIN",
          "CTE",
          "EXISTS",
          "key"
        ],
        "useCase": "Use joins when information lives in multiple related tables.",
        "workflow": "Identify keys -> choose join type -> join -> inspect duplicates/unmatched rows -> aggregate after join if needed.",
        "mistake": "Joining on non-unique or wrong columns and multiplying rows.",
        "check": "Check key uniqueness and compare row counts before/after the join.",
        "example": "LEFT JOIN keeps all customers even when they have no orders."
      },
      {
        "title": "Window functions, changes & performance",
        "summary": "Window functions calculate rankings and running metrics without collapsing detail; safe DML and indexes support real work.",
        "keywords": [
          "ROW_NUMBER",
          "RANK",
          "OVER",
          "transaction",
          "index"
        ],
        "useCase": "Use windows for rankings/running totals and transactions for controlled changes.",
        "workflow": "Define partition/order -> apply window -> validate -> use transaction for changes -> review query plan when slow.",
        "mistake": "Using GROUP BY when row-level detail must be preserved.",
        "check": "Spot-check partitions and confirm ranking/order rules.",
        "example": "ROW_NUMBER() OVER(PARTITION BY Dept ORDER BY Salary DESC)."
      }
    ]
  },
  {
    "id": "powerbi",
    "icon": "BI",
    "title": "Power BI A to Z",
    "category": "Data",
    "level": "Intermediate",
    "pdf": "resources/Power_BI_A_to_Z_MAGIVOX.pdf",
    "description": "Power Query, star schema, DAX, visuals, interactivity and deployment.",
    "topics": [
      {
        "title": "Power BI workflow & Power Query",
        "summary": "Power BI connects to sources, transforms data and loads a model before visuals are built.",
        "keywords": [
          "Power BI Desktop",
          "Power Query",
          "ETL",
          "data type",
          "profiling"
        ],
        "useCase": "Use Power Query to make repeatable cleaning steps.",
        "workflow": "Get Data -> profile -> set types -> clean -> close & apply -> verify model rows.",
        "mistake": "Fixing data visually in a chart instead of correcting the query/model.",
        "check": "Refresh and confirm the same transformations repeat correctly.",
        "example": "Change OrderDate to Date and Units to Whole Number in Power Query."
      },
      {
        "title": "Data modelling & star schema",
        "summary": "A star schema separates fact events from descriptive dimensions with clear relationships.",
        "keywords": [
          "fact",
          "dimension",
          "star schema",
          "relationship",
          "cardinality"
        ],
        "useCase": "Use star schema to make DAX and filtering predictable.",
        "workflow": "Identify grain -> build fact/dimensions -> create one-to-many relationships -> test filters.",
        "mistake": "Creating many-to-many relationships without understanding the grain.",
        "check": "Filter from a dimension and verify the intended fact rows change.",
        "example": "Products[ProductID] one-to-many Sales[ProductID]."
      },
      {
        "title": "DAX measures & context",
        "summary": "DAX measures calculate dynamically under filter context; CALCULATE changes filter context.",
        "keywords": [
          "measure",
          "CALCULATE",
          "filter context",
          "SUMX",
          "DIVIDE"
        ],
        "useCase": "Use measures for KPIs that must respond to slicers and report context.",
        "workflow": "Define base measure -> test total -> add CALCULATE/iterators -> test under filters.",
        "mistake": "Using a calculated column for a result that should change with filters.",
        "check": "Test the measure with multiple slicer selections and known totals.",
        "example": "Revenue = SUMX(Sales, Sales[Units] * Sales[UnitPrice])."
      },
      {
        "title": "Time intelligence & interactions",
        "summary": "Date tables, slicers, drill, tooltips and bookmarks create coherent analysis across time and views.",
        "keywords": [
          "date table",
          "time intelligence",
          "slicer",
          "drillthrough",
          "bookmark"
        ],
        "useCase": "Use a marked date table and controlled interactions for time-based reporting.",
        "workflow": "Create continuous date table -> relate -> mark -> write measure -> add slicer -> test interactions.",
        "mistake": "Using month names without a month number sort column.",
        "check": "Verify chronological sort and filter propagation.",
        "example": "Month = FORMAT(DateTable[Date], \"MMMM\") sorted by Month No."
      },
      {
        "title": "Dashboard design, RLS & service",
        "summary": "A production report needs readable layout, validated totals, security rules and refresh/publish planning.",
        "keywords": [
          "dashboard",
          "RLS",
          "Power BI Service",
          "refresh",
          "accessibility"
        ],
        "useCase": "Use design and service features to deliver safe, usable reports.",
        "workflow": "Validate KPIs -> simplify layout -> configure RLS -> publish -> test as role -> check refresh.",
        "mistake": "Assuming RLS works without testing with View as role.",
        "check": "Test role access and refresh status before sharing.",
        "example": "Sales managers can be limited to their assigned region using RLS."
      }
    ]
  },
  {
    "id": "tableau",
    "icon": "TB",
    "title": "Tableau A to Z",
    "category": "Data",
    "level": "Beginner",
    "pdf": "resources/Tableau_A_to_Z_MAGIVOX.pdf",
    "description": "Connections, charts, calculations, LOD, dashboards and actions.",
    "topics": [
      {
        "title": "Connect, relationships & data roles",
        "summary": "Tableau connects to data and uses relationships/joins while dimensions and measures define analysis roles.",
        "keywords": [
          "relationship",
          "join",
          "dimension",
          "measure",
          "live",
          "extract"
        ],
        "useCase": "Use correct data connections and roles before building views.",
        "workflow": "Connect -> inspect types -> choose live/extract -> model relationships -> verify rows.",
        "mistake": "Using a physical join that duplicates rows when a relationship is more appropriate.",
        "check": "Compare totals before and after modelling.",
        "example": "Relate Orders to Returns using the appropriate key."
      },
      {
        "title": "Charts, marks & filters",
        "summary": "Rows, Columns and the Marks card determine how data is encoded; filters control the visible domain.",
        "keywords": [
          "Marks",
          "Rows",
          "Columns",
          "filter",
          "context filter"
        ],
        "useCase": "Use chart type and encodings that match the question.",
        "workflow": "Choose dimension/measure -> build view -> set marks -> sort -> filter -> label selectively.",
        "mistake": "Using too many colors/labels and making the view unreadable.",
        "check": "Confirm the filtered total and sort order.",
        "example": "Sales by Category can be a sorted bar chart."
      },
      {
        "title": "Calculated fields & table calculations",
        "summary": "Calculated fields create derived values; table calculations operate on marks already in the view.",
        "keywords": [
          "calculated field",
          "table calculation",
          "running total",
          "percent of total",
          "compute using"
        ],
        "useCase": "Use calculated fields for reusable logic and table calculations for view-dependent metrics.",
        "workflow": "Create calc -> validate aggregation -> add to view -> configure compute using.",
        "mistake": "Mixing aggregate and non-aggregate expressions incorrectly.",
        "check": "Change view grain and confirm the calculation still means what you intend.",
        "example": "RUNNING_SUM(SUM([Sales])) gives a running total in the configured direction."
      },
      {
        "title": "LOD, parameters & sets",
        "summary": "LOD expressions control calculation granularity; parameters and sets add flexible analysis.",
        "keywords": [
          "FIXED",
          "INCLUDE",
          "EXCLUDE",
          "parameter",
          "set"
        ],
        "useCase": "Use LOD when the calculation grain differs from the view and parameters for user choices.",
        "workflow": "Define required grain -> write LOD -> validate -> expose parameter/set -> connect to calc.",
        "mistake": "Forgetting filter order when a FIXED LOD appears not to respond.",
        "check": "Test with and without relevant context filters.",
        "example": "{ FIXED [Customer ID] : SUM([Sales]) } computes customer-level sales."
      },
      {
        "title": "Dashboards, actions & storytelling",
        "summary": "Dashboards combine sheets with filter/highlight actions, tooltips and deliberate layout.",
        "keywords": [
          "dashboard",
          "action",
          "tooltip",
          "story",
          "device layout"
        ],
        "useCase": "Use interactions to help users explore without losing context.",
        "workflow": "Choose KPI/views -> arrange -> add actions -> test -> simplify -> publish.",
        "mistake": "Adding every worksheet to one dashboard.",
        "check": "Click each action and verify the intended sheets update.",
        "example": "A map selection can filter a category chart and KPI cards."
      }
    ]
  },
  {
    "id": "python",
    "icon": "PY",
    "title": "Python Programming",
    "category": "Programming",
    "level": "Beginner",
    "pdf": "resources/Python_A_to_Z_MAGIVOX.pdf",
    "description": "Core Python, collections, OOP, files, data tools and interview practice.",
    "topics": [
      {
        "title": "Python foundation, variables & control flow",
        "summary": "Python programs use variables, built-in types, conditions and loops to express logic.",
        "keywords": [
          "variable",
          "type",
          "if",
          "for",
          "while"
        ],
        "useCase": "Use these fundamentals to read input, make decisions and repeat work.",
        "workflow": "Define data -> inspect type -> apply condition/loop -> print/test output.",
        "mistake": "Changing a list while iterating over it without understanding the effect.",
        "check": "Test empty, boundary and typical inputs.",
        "example": "for n in range(1, 6): print(n)"
      },
      {
        "title": "Strings, collections & functions",
        "summary": "Strings plus lists, tuples, sets and dictionaries store common data; functions organise reusable logic.",
        "keywords": [
          "list",
          "tuple",
          "set",
          "dictionary",
          "function"
        ],
        "useCase": "Use the right collection and functions to keep code clear and reusable.",
        "workflow": "Choose structure -> define function -> pass arguments -> return result -> test.",
        "mistake": "Using a mutable object as a default function argument.",
        "check": "Call the function with multiple cases including empty collections.",
        "example": "def total(values): return sum(values)"
      },
      {
        "title": "Modules, errors & files",
        "summary": "Modules organise code; exceptions handle expected failures; context managers manage files safely.",
        "keywords": [
          "module",
          "try",
          "except",
          "with",
          "CSV",
          "JSON"
        ],
        "useCase": "Use exceptions and file handling for robust programs.",
        "workflow": "Open resource with with -> parse -> validate -> handle specific errors -> close automatically.",
        "mistake": "Catching every exception with bare except and hiding bugs.",
        "check": "Test missing file, invalid row and valid file cases.",
        "example": "with open(\"data.txt\") as f: text = f.read()"
      },
      {
        "title": "OOP & modern Python",
        "summary": "Classes model state/behaviour; comprehensions, iterators and common Python patterns make code expressive.",
        "keywords": [
          "class",
          "object",
          "inheritance",
          "comprehension",
          "iterator"
        ],
        "useCase": "Use classes when state and behaviour belong together.",
        "workflow": "Define class -> constructor -> methods -> create objects -> test behaviour.",
        "mistake": "Creating classes where a simple function/data structure would be clearer.",
        "check": "Check object state before and after method calls.",
        "example": "class Employee: ..."
      },
      {
        "title": "Data analysis, testing & project",
        "summary": "Python data work commonly uses tabular libraries and a project should include cleaning, analysis, output and tests.",
        "keywords": [
          "pandas",
          "DataFrame",
          "testing",
          "debugging",
          "project"
        ],
        "useCase": "Use Python to automate a small real analysis end to end.",
        "workflow": "Load -> inspect -> clean -> analyse -> visualize/export -> test assumptions.",
        "mistake": "Trusting column types or missing-value handling without checking.",
        "check": "Compare summary totals with source data and rerun from a clean start.",
        "example": "Read a CSV, group sales by city and export the summary."
      }
    ]
  },
  {
    "id": "r",
    "icon": "R",
    "title": "R for Data Analysis",
    "category": "Data",
    "level": "Intermediate",
    "pdf": "resources/R_Language_A_to_Z_MAGIVOX.pdf",
    "description": "R objects, data frames, cleaning, statistics and visualisation.",
    "topics": [
      {
        "title": "R foundation & objects",
        "summary": "R uses vectors and other objects for statistical and analytical work.",
        "keywords": [
          "vector",
          "factor",
          "list",
          "matrix",
          "assignment"
        ],
        "useCase": "Use R objects to store and inspect analysis inputs.",
        "workflow": "Create object -> inspect class/structure -> subset -> calculate -> verify.",
        "mistake": "Mixing incompatible types and not checking coercion.",
        "check": "Use str() and summary() to inspect the object.",
        "example": "sales <- c(120, 150, 90)"
      },
      {
        "title": "Data frames & transformation",
        "summary": "Data frames hold tabular data and transformations create analysis-ready columns/rows.",
        "keywords": [
          "data.frame",
          "filter",
          "select",
          "mutate",
          "group_by"
        ],
        "useCase": "Use transformations to clean and reshape datasets.",
        "workflow": "Load -> inspect -> filter/select -> mutate -> group/summarise.",
        "mistake": "Overwriting raw data without keeping a reproducible pipeline.",
        "check": "Compare row counts and summaries after each major step.",
        "example": "group_by(city) |> summarise(total=sum(sales))"
      },
      {
        "title": "Cleaning & joins",
        "summary": "Cleaning handles missing/duplicate/inconsistent data; joins combine tables by keys.",
        "keywords": [
          "NA",
          "duplicate",
          "join",
          "key",
          "tidyr"
        ],
        "useCase": "Use cleaning and joins before statistics or visualisation.",
        "workflow": "Profile -> handle NA -> standardise -> deduplicate -> join -> validate.",
        "mistake": "Dropping all NA rows without checking business meaning.",
        "check": "Check unmatched keys and duplicate keys after join.",
        "example": "left_join(sales, products, by=\"product_id\")"
      },
      {
        "title": "Statistics",
        "summary": "Descriptive statistics summarise centre, spread and relationships before advanced inference.",
        "keywords": [
          "mean",
          "median",
          "sd",
          "correlation",
          "distribution"
        ],
        "useCase": "Use statistics to describe data and support cautious interpretation.",
        "workflow": "Inspect distribution -> choose statistic -> calculate -> compare groups -> interpret.",
        "mistake": "Treating correlation as proof of causation.",
        "check": "Check outliers and sample size before interpreting results.",
        "example": "cor(x, y, use=\"complete.obs\")"
      },
      {
        "title": "Visualisation & reporting",
        "summary": "Plots reveal patterns when chart choice, labels and scales are clear.",
        "keywords": [
          "ggplot2",
          "aesthetic",
          "geom",
          "facet",
          "theme"
        ],
        "useCase": "Use visualisation to communicate one analytical question at a time.",
        "workflow": "Define question -> map aesthetics -> choose geom -> label -> facet if useful -> review.",
        "mistake": "Using misleading axes or too many categories/colors.",
        "check": "Verify plot values against summary tables.",
        "example": "ggplot(df, aes(city, sales)) + geom_col()"
      }
    ]
  },
  {
    "id": "java",
    "icon": "JV",
    "title": "Java Programming",
    "category": "Programming",
    "level": "Beginner",
    "pdf": "resources/Java_A_to_Z_MAGIVOX.pdf",
    "description": "Core Java, OOP, collections, exceptions, files, JDBC and interview practice.",
    "topics": [
      {
        "title": "Java foundation & control flow",
        "summary": "Java source compiles to bytecode and uses strongly typed variables plus control statements.",
        "keywords": [
          "JDK",
          "JVM",
          "bytecode",
          "data type",
          "loop"
        ],
        "useCase": "Use core syntax to build reliable console programs.",
        "workflow": "Write class/main -> declare data -> apply control flow -> compile -> run -> inspect.",
        "mistake": "Confusing compile-time errors with runtime exceptions.",
        "check": "Compile from clean source and test boundary conditions.",
        "example": "public static void main(String[] args) { ... }"
      },
      {
        "title": "Methods, arrays & strings",
        "summary": "Methods organise reusable behaviour while arrays and strings handle common sequential data.",
        "keywords": [
          "method",
          "overloading",
          "array",
          "String",
          "StringBuilder"
        ],
        "useCase": "Use methods for decomposition and choose StringBuilder for repeated string modification.",
        "workflow": "Define input/output -> method -> call -> test -> handle array bounds.",
        "mistake": "Using == to compare String contents instead of equals().",
        "check": "Test empty strings and first/last array indexes.",
        "example": "name.equals(\"Koushik\")"
      },
      {
        "title": "OOP",
        "summary": "Encapsulation, inheritance, polymorphism and abstraction organise object-oriented Java programs.",
        "keywords": [
          "class",
          "encapsulation",
          "inheritance",
          "polymorphism",
          "interface"
        ],
        "useCase": "Use OOP to model related data and behaviour with clear responsibilities.",
        "workflow": "Design class -> private fields -> constructor -> methods -> interface/inheritance only when useful.",
        "mistake": "Making every field public and losing encapsulation.",
        "check": "Create multiple objects and verify overridden behaviour.",
        "example": "Employee e = new Employee(\"Asha\");"
      },
      {
        "title": "Collections, exceptions & files",
        "summary": "Collections manage dynamic groups; exceptions and try-with-resources support robust I/O.",
        "keywords": [
          "ArrayList",
          "HashMap",
          "Set",
          "exception",
          "try-with-resources"
        ],
        "useCase": "Use collections according to ordering/uniqueness/lookup needs and handle expected failures specifically.",
        "workflow": "Choose collection -> add/read -> handle errors -> close resources -> test.",
        "mistake": "Catching Exception everywhere and ignoring the cause.",
        "check": "Test duplicate data, missing key and file-not-found cases.",
        "example": "Map<String,Integer> scores = new HashMap<>();"
      },
      {
        "title": "Streams, JDBC & project",
        "summary": "Modern Java streams process collections; JDBC connects applications to relational databases.",
        "keywords": [
          "stream",
          "lambda",
          "JDBC",
          "PreparedStatement",
          "transaction"
        ],
        "useCase": "Use streams for readable pipelines and prepared statements for safe database queries.",
        "workflow": "Connect -> prepare -> bind params -> execute -> read result -> close/commit.",
        "mistake": "Building SQL by concatenating user input.",
        "check": "Verify transaction outcome and close every database resource.",
        "example": "PreparedStatement ps = con.prepareStatement(\"SELECT * FROM users WHERE id=?\");"
      }
    ]
  },
  {
    "id": "dsa",
    "icon": "DS",
    "title": "Data Structures & Algorithms",
    "category": "Programming",
    "level": "Intermediate",
    "pdf": "resources/Data_Structures_A_to_Z_MAGIVOX.pdf",
    "description": "Complexity, arrays, linked structures, trees, graphs and interview problem solving.",
    "topics": [
      {
        "title": "Complexity, arrays & strings",
        "summary": "Complexity estimates resource growth; arrays/strings enable core scanning and two-pointer patterns.",
        "keywords": [
          "Big O",
          "array",
          "string",
          "two pointers",
          "sliding window"
        ],
        "useCase": "Use these tools for foundational interview problems.",
        "workflow": "Clarify constraints -> brute force -> identify repeated work -> apply pattern -> test complexity.",
        "mistake": "Optimising before confirming the brute-force logic.",
        "check": "State time/space complexity and test small/edge inputs.",
        "example": "Two pointers can test a palindrome from both ends."
      },
      {
        "title": "Linked lists, stacks & queues",
        "summary": "Linked structures support dynamic links while stacks and queues model LIFO/FIFO processing.",
        "keywords": [
          "linked list",
          "stack",
          "queue",
          "LIFO",
          "FIFO"
        ],
        "useCase": "Use the structure that matches required insertion/access order.",
        "workflow": "Draw structure -> define operation -> update links/indices -> test empty/single/multiple cases.",
        "mistake": "Losing a node reference while changing links.",
        "check": "Test empty and one-element structures before larger cases.",
        "example": "A stack can validate balanced brackets."
      },
      {
        "title": "Searching, sorting & hashing",
        "summary": "Binary search exploits sorted order; sorting and hash maps enable efficient lookup/grouping.",
        "keywords": [
          "binary search",
          "sort",
          "hash map",
          "frequency",
          "O(log n)"
        ],
        "useCase": "Use these patterns to reduce repeated scanning.",
        "workflow": "Check sorted/lookup requirement -> choose approach -> implement -> test duplicates/bounds.",
        "mistake": "Using binary search on unsorted data.",
        "check": "Confirm sort order and test duplicate target values.",
        "example": "A frequency map finds the most common value in O(n) expected time."
      },
      {
        "title": "Trees, heaps & graphs",
        "summary": "Trees model hierarchy, heaps support priority, and graphs model general relationships.",
        "keywords": [
          "tree",
          "BST",
          "heap",
          "graph",
          "BFS",
          "DFS"
        ],
        "useCase": "Use traversal and priority structures for hierarchical/network problems.",
        "workflow": "Build representation -> mark visited if graph -> traverse -> maintain invariant -> test disconnected cases.",
        "mistake": "Forgetting visited tracking in cyclic graphs.",
        "check": "Test root/leaf/disconnected/cycle cases as applicable.",
        "example": "BFS uses a queue to visit graph nodes level by level."
      },
      {
        "title": "Recursion, DP & interview strategy",
        "summary": "Recursion breaks a problem into self-similar calls; DP caches overlapping subproblems.",
        "keywords": [
          "recursion",
          "base case",
          "memoization",
          "tabulation",
          "dynamic programming"
        ],
        "useCase": "Use recursion/backtracking/DP when subproblem structure is clear.",
        "workflow": "Define state -> base case -> transition -> memoize/tabulate -> analyse complexity.",
        "mistake": "Writing recursion without a terminating base case.",
        "check": "Trace small inputs and confirm each state is computed as intended.",
        "example": "Fibonacci can be improved from exponential recursion to O(n) DP."
      }
    ]
  },
  {
    "id": "gis",
    "icon": "GIS",
    "title": "GIS Mapping",
    "category": "Specialised",
    "level": "Beginner",
    "pdf": "resources/GIS_Mapping_A_to_Z_MAGIVOX.pdf",
    "description": "Spatial data, CRS, QGIS, digitising, analysis and cartography.",
    "topics": [
      {
        "title": "Spatial data & GIS foundation",
        "summary": "GIS links location geometry with attributes; vector and raster are the two core data models.",
        "keywords": [
          "GIS",
          "vector",
          "raster",
          "attribute",
          "layer"
        ],
        "useCase": "Use GIS to analyse questions that depend on location.",
        "workflow": "Define question -> choose vector/raster -> load layers -> inspect attributes -> validate extent.",
        "mistake": "Treating every dataset as interchangeable regardless of geometry/resolution.",
        "check": "Check layer type, extent and attribute meaning.",
        "example": "Hospitals as points; district boundaries as polygons; satellite image as raster."
      },
      {
        "title": "Coordinate systems & CRS",
        "summary": "A CRS defines how coordinates map to Earth; geographic and projected systems serve different purposes.",
        "keywords": [
          "CRS",
          "EPSG",
          "geographic",
          "projected",
          "reproject"
        ],
        "useCase": "Use appropriate projected CRS for reliable distance/area calculations.",
        "workflow": "Inspect layer CRS -> set/repair if known -> reproject when needed -> test alignment.",
        "mistake": "Assigning a new CRS instead of reprojecting coordinates.",
        "check": "Overlay known layers and verify they align in the expected location.",
        "example": "WGS84 is geographic; a local projected CRS is often better for metres."
      },
      {
        "title": "QGIS layers, digitising & attributes",
        "summary": "QGIS manages layers, editing, snapping, fields and attribute operations.",
        "keywords": [
          "QGIS",
          "digitising",
          "snapping",
          "field calculator",
          "attribute table"
        ],
        "useCase": "Use these tools to create and maintain clean spatial features.",
        "workflow": "Create/load layer -> set CRS -> enable edit -> snap -> add geometry/attributes -> validate -> save.",
        "mistake": "Digitising without snapping and creating gaps/overlaps.",
        "check": "Run geometry checks and inspect required fields.",
        "example": "Digitise road lines while snapping endpoints."
      },
      {
        "title": "Spatial & raster analysis",
        "summary": "Buffer, clip, intersect, spatial join and raster tools derive new geographic information.",
        "keywords": [
          "buffer",
          "clip",
          "intersect",
          "spatial join",
          "raster calculator"
        ],
        "useCase": "Use spatial analysis to answer proximity, overlap and zonal questions.",
        "workflow": "Choose operation -> confirm CRS -> set parameters -> run -> inspect output -> validate counts/areas.",
        "mistake": "Running distance operations in degrees without understanding units.",
        "check": "Spot-check features and compare expected input/output counts.",
        "example": "Buffer hospitals by 1 km and count schools inside buffers."
      },
      {
        "title": "Map design & project",
        "summary": "A map should communicate clearly with title, legend, scale, source and appropriate symbology.",
        "keywords": [
          "layout",
          "legend",
          "scale bar",
          "symbology",
          "metadata"
        ],
        "useCase": "Use cartographic design to present analytical results responsibly.",
        "workflow": "Set hierarchy -> symbolise -> label -> compose layout -> add source/CRS -> export -> review.",
        "mistake": "Using too many colors or omitting source/units.",
        "check": "Print/export and verify labels, legend and scale remain readable.",
        "example": "A final PDF map shows service gaps with clear legend and source note."
      }
    ]
  },
  {
    "id": "html",
    "icon": "HTML",
    "title": "HTML",
    "category": "Web",
    "level": "Beginner",
    "pdf": "resources/HTML_A_to_Z_MAGIVOX.pdf",
    "description": "Semantic structure, forms, accessibility, media and project practice.",
    "topics": [
      {
        "title": "Document structure & text",
        "summary": "HTML describes page structure using elements inside a valid document skeleton.",
        "keywords": [
          "DOCTYPE",
          "head",
          "body",
          "heading",
          "paragraph"
        ],
        "useCase": "Use semantic structure so browsers and assistive tools understand the page.",
        "workflow": "Create skeleton -> add headings/content -> validate nesting -> preview.",
        "mistake": "Skipping heading levels only to get a visual size.",
        "check": "Inspect document outline and HTML validator errors.",
        "example": "<!doctype html><html lang=\"en\">...</html>"
      },
      {
        "title": "Links, images, lists & tables",
        "summary": "HTML elements represent navigation, media, lists and tabular data with meaningful attributes.",
        "keywords": [
          "anchor",
          "img",
          "alt",
          "list",
          "table"
        ],
        "useCase": "Use the element that matches content meaning, not visual appearance.",
        "workflow": "Add content -> provide alt/caption -> use correct path -> test link/table headers.",
        "mistake": "Using an image of text instead of real accessible text.",
        "check": "Keyboard-test links and verify image alt text communicates purpose.",
        "example": "<img src=\"chart.png\" alt=\"Monthly sales bar chart\">"
      },
      {
        "title": "Semantic layout & accessibility",
        "summary": "Landmark elements and accessible labels improve navigation and meaning.",
        "keywords": [
          "main",
          "nav",
          "section",
          "article",
          "label",
          "accessibility"
        ],
        "useCase": "Use semantic landmarks and correctly associated labels for interactive content.",
        "workflow": "Choose landmark -> label controls -> ensure keyboard order -> add ARIA only if needed.",
        "mistake": "Adding ARIA to replace native semantic elements unnecessarily.",
        "check": "Navigate page with keyboard and inspect form labels.",
        "example": "<label for=\"email\">Email</label><input id=\"email\">"
      },
      {
        "title": "Forms & validation",
        "summary": "Forms collect data through controls, labels and browser validation attributes.",
        "keywords": [
          "form",
          "input",
          "select",
          "textarea",
          "required"
        ],
        "useCase": "Use forms for structured user input and validate on both client and server.",
        "workflow": "Define fields -> label -> choose type -> set constraints -> handle submit -> show errors.",
        "mistake": "Relying only on client validation for security.",
        "check": "Submit valid/invalid/empty data and check clear errors.",
        "example": "<input type=\"email\" required>"
      },
      {
        "title": "Metadata, responsive markup & project",
        "summary": "Metadata supports devices/search sharing while responsive markup keeps content useful across screens.",
        "keywords": [
          "meta viewport",
          "title",
          "description",
          "picture",
          "project"
        ],
        "useCase": "Use clean metadata and responsive content sources in a production page.",
        "workflow": "Set title/description/viewport -> build semantic page -> test mobile -> validate -> deploy.",
        "mistake": "Forgetting the viewport meta tag on responsive pages.",
        "check": "Check mobile rendering, title and accessibility basics.",
        "example": "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"
      }
    ]
  },
  {
    "id": "css",
    "icon": "CSS",
    "title": "CSS",
    "category": "Web",
    "level": "Beginner",
    "pdf": "resources/CSS_A_to_Z_MAGIVOX.pdf",
    "description": "Cascade, box model, Flexbox, Grid, responsive UI and animation.",
    "topics": [
      {
        "title": "Cascade, selectors & units",
        "summary": "CSS rules match elements through selectors and resolve conflicts through cascade/specificity/inheritance.",
        "keywords": [
          "selector",
          "cascade",
          "specificity",
          "rem",
          "CSS variable"
        ],
        "useCase": "Use simple selectors and scalable units for maintainable styling.",
        "workflow": "Choose class -> write rule -> inspect computed style -> avoid specificity escalation.",
        "mistake": "Using !important repeatedly instead of fixing selector structure.",
        "check": "Inspect computed styles and verify which rule wins.",
        "example": ".card { padding: 1rem; }"
      },
      {
        "title": "Box model, typography & display",
        "summary": "Every element has content, padding, border and margin; display affects layout participation.",
        "keywords": [
          "box model",
          "padding",
          "margin",
          "box-sizing",
          "display"
        ],
        "useCase": "Use box-sizing and readable typography to make predictable components.",
        "workflow": "Set box-sizing -> size -> spacing -> typography -> inspect overflow.",
        "mistake": "Confusing margin with padding.",
        "check": "Use DevTools box model and test long content.",
        "example": "* { box-sizing: border-box; }"
      },
      {
        "title": "Flexbox",
        "summary": "Flexbox lays items along one main axis with alignment, spacing and flexible sizing.",
        "keywords": [
          "flex",
          "justify-content",
          "align-items",
          "gap",
          "flex-basis"
        ],
        "useCase": "Use Flexbox for rows/columns where one-dimensional alignment is primary.",
        "workflow": "display:flex -> choose direction -> gap -> align -> control flex sizing -> test wrap.",
        "mistake": "Trying to build a complex two-dimensional page grid entirely with Flexbox.",
        "check": "Resize container and inspect wrap/alignment.",
        "example": ".row { display:flex; gap:1rem; align-items:center; }"
      },
      {
        "title": "Grid & responsive design",
        "summary": "CSS Grid controls rows and columns; media queries and fluid sizing adapt layouts.",
        "keywords": [
          "grid",
          "fr",
          "minmax",
          "media query",
          "responsive"
        ],
        "useCase": "Use Grid for two-dimensional layouts and mobile-first adjustments.",
        "workflow": "Define grid -> fluid columns -> gap -> add breakpoint only when needed -> test.",
        "mistake": "Using fixed pixel widths that overflow on small screens.",
        "check": "Test narrow, medium and wide viewport sizes.",
        "example": "grid-template-columns: repeat(auto-fit,minmax(220px,1fr));"
      },
      {
        "title": "States, motion & architecture",
        "summary": "Focus/hover/disabled states, transitions and reusable component styles improve usability and maintainability.",
        "keywords": [
          "focus",
          "transition",
          "animation",
          "component",
          "prefers-reduced-motion"
        ],
        "useCase": "Use visible focus states and restrained motion that respects user preferences.",
        "workflow": "Style base -> focus/hover/disabled -> transition -> reduced-motion rule -> reuse classes.",
        "mistake": "Removing focus outlines without an accessible replacement.",
        "check": "Keyboard-test interactive controls and reduced-motion preference.",
        "example": "@media (prefers-reduced-motion: reduce) { * { animation:none; } }"
      }
    ]
  },
  {
    "id": "javascript",
    "icon": "JS",
    "title": "JavaScript",
    "category": "Web",
    "level": "Beginner",
    "pdf": "resources/JavaScript_A_to_Z_MAGIVOX.pdf",
    "description": "Core JavaScript, arrays, DOM, async APIs and debugging.",
    "topics": [
      {
        "title": "Values, variables & control flow",
        "summary": "JavaScript uses values/types, let/const and conditions/loops to implement browser logic.",
        "keywords": [
          "let",
          "const",
          "type",
          "if",
          "loop"
        ],
        "useCase": "Use these fundamentals for small interactive behaviours.",
        "workflow": "Define state -> validate type -> branch/loop -> log/test output.",
        "mistake": "Using == when strict equality === is intended.",
        "check": "Test falsy values and boundary inputs.",
        "example": "const total = price * qty;"
      },
      {
        "title": "Functions, arrays & objects",
        "summary": "Functions encapsulate logic; arrays and objects model collections and records.",
        "keywords": [
          "function",
          "array",
          "object",
          "map",
          "filter"
        ],
        "useCase": "Use collection methods and functions to transform data without repeated code.",
        "workflow": "Choose data structure -> define function -> transform -> return -> test immutability expectations.",
        "mistake": "Using map when no returned array is needed or mutating unexpectedly.",
        "check": "Check output length/content and original data when relevant.",
        "example": "const names = users.map(u => u.name);"
      },
      {
        "title": "DOM & events",
        "summary": "The DOM represents page nodes; events connect user actions to JavaScript handlers.",
        "keywords": [
          "DOM",
          "querySelector",
          "event",
          "classList",
          "textContent"
        ],
        "useCase": "Use DOM APIs to update UI safely in response to user actions.",
        "workflow": "Select element -> listen -> validate -> update text/class/DOM -> test keyboard interaction.",
        "mistake": "Using innerHTML with untrusted text and creating injection risk.",
        "check": "Test click, keyboard and repeated interactions.",
        "example": "button.addEventListener(\"click\", () => panel.classList.toggle(\"open\"));"
      },
      {
        "title": "Async, fetch & errors",
        "summary": "Promises and async/await manage operations that finish later such as network requests.",
        "keywords": [
          "Promise",
          "async",
          "await",
          "fetch",
          "try catch"
        ],
        "useCase": "Use async/await with response checks and error handling for APIs.",
        "workflow": "Start request -> await -> check response.ok -> parse -> render -> catch -> cleanup.",
        "mistake": "Assuming fetch rejects automatically for HTTP 404/500.",
        "check": "Test success, HTTP error, timeout/offline states.",
        "example": "const r = await fetch(url); if (!r.ok) throw new Error(\"Failed\");"
      },
      {
        "title": "Modules, storage & project",
        "summary": "ES modules organise code while localStorage can persist small non-sensitive browser state.",
        "keywords": [
          "module",
          "import",
          "export",
          "localStorage",
          "JSON"
        ],
        "useCase": "Use modules for separation and storage for small client preferences/progress.",
        "workflow": "Split module -> export/import -> serialize -> save -> load -> validate -> build project.",
        "mistake": "Storing secrets or sensitive credentials in localStorage.",
        "check": "Reload page and confirm only intended data persists.",
        "example": "localStorage.setItem(\"theme\", \"dark\");"
      }
    ]
  },
  {
    "id": "data-entry",
    "icon": "DE",
    "title": "Data Entry & Office Accuracy",
    "category": "Workplace",
    "level": "Beginner",
    "pdf": "resources/Data_Entry_A_to_Z_MAGIVOX.pdf",
    "description": "Typing, formats, Excel entry, validation, quality and security.",
    "topics": [
      {
        "title": "Accuracy & typing discipline",
        "summary": "Data entry prioritises correct, consistent capture of source information before speed.",
        "keywords": [
          "accuracy",
          "typing",
          "source",
          "verification",
          "WPM"
        ],
        "useCase": "Use a controlled rhythm and verification process to reduce costly errors.",
        "workflow": "Read source -> enter -> pause -> compare -> correct -> record exceptions.",
        "mistake": "Chasing high WPM while error rate increases.",
        "check": "Measure both speed and accuracy on the same timed sample.",
        "example": "Recheck names, IDs and numbers against the source after each batch."
      },
      {
        "title": "Data formats & spreadsheet entry",
        "summary": "Text, numbers, dates and codes must be stored in the format that preserves their meaning.",
        "keywords": [
          "text",
          "number",
          "date",
          "leading zero",
          "Excel"
        ],
        "useCase": "Use appropriate cell formats and consistent conventions.",
        "workflow": "Identify field type -> set format -> enter -> validate -> inspect edge cases.",
        "mistake": "Converting ID 00125 to number and losing leading zeros.",
        "check": "Check representative rows including codes/dates.",
        "example": "Store postal or ID codes as text when leading zeros matter."
      },
      {
        "title": "Validation & cleaning",
        "summary": "Validation rules and cleaning tools prevent or detect inconsistent entries.",
        "keywords": [
          "data validation",
          "duplicate",
          "TRIM",
          "standardise",
          "required field"
        ],
        "useCase": "Use rules, dropdowns and duplicate checks to improve quality.",
        "workflow": "Define allowed values -> validate -> find duplicates -> standardise -> recheck totals.",
        "mistake": "Removing duplicates without confirming which record is authoritative.",
        "check": "Compare before/after row counts and document removed records.",
        "example": "Use a status dropdown instead of free-text spelling variants."
      },
      {
        "title": "Quality control & file handling",
        "summary": "Quality control uses totals, samples, version naming and error logs to make work traceable.",
        "keywords": [
          "quality control",
          "sampling",
          "version",
          "backup",
          "error log"
        ],
        "useCase": "Use checks and clear file versions so changes can be reviewed.",
        "workflow": "Save version -> enter batch -> run totals/sample -> log issues -> backup.",
        "mistake": "Overwriting the only copy of a source file.",
        "check": "Confirm totals and sample rows before handoff.",
        "example": "Use YYYY-MM-DD in filenames for predictable sorting."
      },
      {
        "title": "Security & job readiness",
        "summary": "Data-entry staff must protect confidential information and explain accuracy methods in interviews.",
        "keywords": [
          "confidentiality",
          "phishing",
          "access",
          "interview",
          "timed test"
        ],
        "useCase": "Use least access, careful sharing and a repeatable test routine.",
        "workflow": "Verify recipient -> share minimum needed -> lock screen -> report suspicious requests -> practise timed task.",
        "mistake": "Sending confidential files through an unapproved channel.",
        "check": "Review permissions and confirm no sensitive data is exposed.",
        "example": "Interview answer: explain your double-check and validation process."
      }
    ]
  },
  {
    "id": "aptitude",
    "icon": "APT",
    "title": "Aptitude & Reasoning",
    "category": "Assessment",
    "level": "Beginner",
    "pdf": "resources/Aptitude_Reasoning_A_to_Z_MAGIVOX.pdf",
    "description": "Arithmetic, percentages, ratio, work, speed and logical reasoning.",
    "topics": [
      {
        "title": "BODMAS & number basics",
        "summary": "BODMAS sets operation order; number basics include factors, multiples, divisibility and remainders.",
        "keywords": [
          "BODMAS",
          "factor",
          "multiple",
          "LCM",
          "HCF"
        ],
        "useCase": "Use operation order and number properties to simplify arithmetic accurately.",
        "workflow": "Brackets -> powers -> divide/multiply left-to-right -> add/subtract left-to-right.",
        "mistake": "Doing addition before division because it appears first visually.",
        "check": "Recalculate using the ordered steps.",
        "example": "18 - 6 / 2 + 3 = 18."
      },
      {
        "title": "Percentages, ratio & average",
        "summary": "Percentages compare per hundred; ratios compare parts; averages summarise central value.",
        "keywords": [
          "percentage",
          "ratio",
          "proportion",
          "average",
          "weighted average"
        ],
        "useCase": "Use these concepts in pricing, marks and business calculations.",
        "workflow": "Identify base -> convert -> calculate -> sanity-check magnitude.",
        "mistake": "Using the new value as the base when the question needs original value.",
        "check": "Estimate first, then verify exact answer.",
        "example": "25% of 240 = 60."
      },
      {
        "title": "Profit, interest & work",
        "summary": "Profit/loss and interest use percentage relationships; work problems use rates.",
        "keywords": [
          "profit",
          "loss",
          "simple interest",
          "compound interest",
          "work rate"
        ],
        "useCase": "Use formulas only after identifying the correct base and time/rate units.",
        "workflow": "Write known values -> choose formula/rate -> solve -> check units.",
        "mistake": "Mixing percentage and decimal forms in a formula.",
        "check": "Substitute the answer back into the relationship.",
        "example": "SI = P*R*T/100."
      },
      {
        "title": "Speed, time, distance & series",
        "summary": "Distance relationships connect speed/time while series questions depend on detecting a consistent pattern.",
        "keywords": [
          "distance",
          "speed",
          "time",
          "series",
          "relative speed"
        ],
        "useCase": "Use units carefully and test a pattern across multiple sequence gaps.",
        "workflow": "Normalize units -> formula/pattern -> calculate -> verify against all known terms.",
        "mistake": "Choosing a pattern that fits only one transition in a number series.",
        "check": "Check the rule across every transition given.",
        "example": "60 km/h for 2.5 h = 150 km."
      },
      {
        "title": "Logical reasoning & data interpretation",
        "summary": "Reasoning problems require only conclusions supported by premises; data interpretation converts charts/tables into calculations.",
        "keywords": [
          "syllogism",
          "analogy",
          "odd one out",
          "data interpretation",
          "conclusion"
        ],
        "useCase": "Use strict logic and read chart labels/units before calculating.",
        "workflow": "Read premise/table -> note constraints/units -> eliminate unsupported options -> calculate if needed.",
        "mistake": "Adding assumptions not stated in a syllogism.",
        "check": "Explain why each rejected option is unsupported or numerically wrong.",
        "example": "If some employees are analysts and all analysts use data, some employees use data."
      }
    ]
  },
  {
    "id": "interview",
    "icon": "INT",
    "title": "Interview Preparation",
    "category": "Career",
    "level": "All levels",
    "pdf": "resources/Interview_Preparation_MAGIVOX.pdf",
    "description": "Self-introduction, technical, HR, STAR and voice practice.",
    "topics": [
      {
        "title": "Self introduction",
        "summary": "A strong introduction briefly connects your background, relevant skills, one real example and target role.",
        "keywords": [
          "introduction",
          "education",
          "skills",
          "project",
          "role"
        ],
        "useCase": "Use a 30-60 second structure to give interviewers relevant context.",
        "workflow": "Background -> skills -> real project/example -> interest in role -> stop.",
        "mistake": "Listing every personal detail or inventing experience.",
        "check": "Record it and confirm it is concise and factually true.",
        "example": "I completed B.Tech... I have practised SQL and Power BI through..."
      },
      {
        "title": "Technical answers",
        "summary": "Technical answers are clearer when they define, explain why, give an example and mention a common issue.",
        "keywords": [
          "definition",
          "example",
          "tradeoff",
          "technical",
          "clarity"
        ],
        "useCase": "Use a repeatable structure for software and concept questions.",
        "workflow": "Definition -> why -> small example -> common mistake/difference -> answer follow-up.",
        "mistake": "Giving memorised words without explaining the concept.",
        "check": "Ask yourself whether the example actually demonstrates the definition.",
        "example": "For JOIN: define, explain keys, give a customer-order example."
      },
      {
        "title": "Behavioral STAR",
        "summary": "STAR organises behavioral answers into Situation, Task, Action and Result.",
        "keywords": [
          "STAR",
          "situation",
          "task",
          "action",
          "result"
        ],
        "useCase": "Use STAR to show what you actually did in a real situation.",
        "workflow": "Set context -> responsibility -> your action -> result/learning.",
        "mistake": "Spending most of the answer on background and little on your action.",
        "check": "Check that the Action section clearly says what you did.",
        "example": "Describe a dashboard issue, how you cleaned data, and the validated outcome."
      },
      {
        "title": "HR & communication",
        "summary": "HR questions explore motivation and logistics while clear speaking benefits from short, direct sentences.",
        "keywords": [
          "HR",
          "strength",
          "weakness",
          "motivation",
          "communication"
        ],
        "useCase": "Use truthful, role-relevant answers and clarify questions when needed.",
        "workflow": "Listen -> pause -> answer directly -> support with example -> stop.",
        "mistake": "Using a fake weakness designed to sound like a strength.",
        "check": "Check whether the answer addresses the exact question.",
        "example": "Weakness: name a real manageable gap and what you are doing to improve it."
      },
      {
        "title": "Voice practice & final readiness",
        "summary": "Recording, transcribing and reviewing answers helps improve structure and wording before a live interview.",
        "keywords": [
          "recording",
          "transcription",
          "practice score",
          "follow-up",
          "readiness"
        ],
        "useCase": "Use repeated practice with feedback, not a single memorised script.",
        "workflow": "Record -> transcribe -> correct text -> score -> revise -> repeat -> practise follow-up.",
        "mistake": "Treating an AI practice score as a hiring prediction.",
        "check": "Compare versions and track specific improvements.",
        "example": "Practise self-intro, project explanation and one HR answer in the same session."
      }
    ]
  },
  {
    "id": "resume-prep",
    "icon": "CV",
    "title": "ATS Resume & Job Search",
    "category": "Career",
    "level": "All levels",
    "pdf": "resources/ATS_Resume_Job_Search_MAGIVOX.pdf",
    "description": "ATS-friendly resume building, JD match, applications and follow-up.",
    "topics": [
      {
        "title": "ATS-friendly structure",
        "summary": "ATS-friendly resumes use clear headings, readable text, consistent dates and truthful keywords.",
        "keywords": [
          "ATS",
          "heading",
          "keyword",
          "date",
          "readability"
        ],
        "useCase": "Use a simple structure that works for both systems and recruiters.",
        "workflow": "Choose sections -> standard headings -> concise bullets -> consistent dates -> proofread.",
        "mistake": "Putting essential text only inside graphics or decorative elements.",
        "check": "Copy text from the exported PDF and confirm all key content is selectable/readable.",
        "example": "Use Skills, Education, Projects and Experience headings."
      },
      {
        "title": "Strong bullets & projects",
        "summary": "Strong bullets describe an action, task/tool and truthful outcome rather than vague responsibility.",
        "keywords": [
          "action verb",
          "project",
          "tool",
          "result",
          "bullet"
        ],
        "useCase": "Use specific bullets to show what you built or analysed.",
        "workflow": "Start action -> name task/tool -> add result/scale only if true -> tighten wording.",
        "mistake": "Inventing percentages or impact numbers.",
        "check": "Ask whether every claim can be explained in an interview.",
        "example": "Built a Power BI dashboard using sales data to compare revenue by city and product."
      },
      {
        "title": "JD matching",
        "summary": "JD matching identifies required skills and compares them only with skills/evidence actually present in the resume.",
        "keywords": [
          "job description",
          "must-have",
          "keyword",
          "match",
          "gap"
        ],
        "useCase": "Use a tailored version when you genuinely have relevant requested skills.",
        "workflow": "Extract requirements -> mark true matches -> add missing true wording -> leave false skills out.",
        "mistake": "Keyword stuffing skills you cannot demonstrate.",
        "check": "For every matched keyword, locate evidence in skills/project/experience.",
        "example": "If the JD asks SQL joins and you used joins in a project, mention that project clearly."
      },
      {
        "title": "Resume versions & cover letter",
        "summary": "A master resume can produce role-specific versions; a cover letter connects the role with one or two evidence points.",
        "keywords": [
          "resume version",
          "cover letter",
          "role",
          "template",
          "master resume"
        ],
        "useCase": "Use separate truthful versions for different target roles.",
        "workflow": "Keep master -> duplicate -> tailor summary/skills/project order -> label version -> track submission.",
        "mistake": "Editing one file repeatedly and forgetting what was sent to each company.",
        "check": "Save filename/version and application record together.",
        "example": "Data-Analyst-Resume-v3.pdf paired with the application date."
      },
      {
        "title": "Job search & tracker",
        "summary": "A job-search system combines multiple locations/role terms with a status tracker and follow-up notes.",
        "keywords": [
          "job search",
          "saved",
          "applied",
          "interview",
          "follow-up"
        ],
        "useCase": "Use a tracker to avoid duplicate applications and prepare for callbacks.",
        "workflow": "Search -> verify company/listing -> save -> apply on trusted source -> update status -> follow up appropriately.",
        "mistake": "Paying or sharing sensitive data with an unverified recruiter/listing.",
        "check": "Open saved link and verify company/location before applying.",
        "example": "Track Saved -> Applied -> Interview -> Closed/Selected."
      }
    ]
  }
]);

export function getCourse(id) { return COURSES.find(course => course.id === id); }
export function getTopic(courseId, topicIndex) { const c=getCourse(courseId); return c?.topics?.[Number(topicIndex)] || null; }
export function courseSearchText(course){ return `${course.title} ${course.description} ${course.category} ${course.topics.map(t=>`${t.title} ${t.summary} ${t.keywords.join(" ")}`).join(" ")}`.toLowerCase(); }
