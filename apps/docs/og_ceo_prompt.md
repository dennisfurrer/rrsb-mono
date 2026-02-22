ok now create a basic implementation there which has, on the root, a brief explainer for  
 markus re: what the idea behind all of this is from me:

1. put all the code for scoreboard, stats website and the stats backend/pi and database, in  
   one place
2. improve the quality of all of it
3. simplify and document the code so it is understandable
4. create a documentation website which has a 100% german mode for him to understand and be
   able to ask questions about the system and slowly get to grips with javascript/typescript.

then add a rough plan + progress

1. set up this new "mono repo" which is the name for a codebase that contains multiple apps.
   we now have a single github repo for all of this code - done
2. copy the existing versions of the db, scoreboard, stats website and stats backend into
   here and confirm it all works - done
3. rewrite the scoreboard ui so we can replace the shit old unreadable code with a modern,
   high quality and easy to read+maintain codebase. I chose a framework called Vite for this.
   Ultimately it achieves the same thing. We end up with a single html file which we can upload  
   anywhere. - done

---

continue with the rest of the changes we discussed

---

4. upgrade the datamodel to allow for admin ui, concept of which club a table is in, player  
   namne lists, etc (everything we've discussed) AND upgrade the apps to use them
   - NOTE: I will upgrade them in a safe way so old data will be retained

5. create admin ui for management of things (e.g. during tournaments)
6. we'll see

also add a page which has the original vs new tech stack (original was

- stats website: html/css/vanilla javascript/transform animations all in 1, 6555 lines of  
  code, file
- stats backend: expressjs/typescript/prisma - poorly structured code, lots of dead code,  
  unsafe db queries
- scoreboard ui: Vanilla javascript, html, jquery, php, css - terrible code
