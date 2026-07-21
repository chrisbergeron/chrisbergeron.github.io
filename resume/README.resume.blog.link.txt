
Hexo Blog chrisbergeron.com:

resume.md markdown file for hexo lives in ~/Documents/Resume/resume.md
create symlink in blog dir pointing to this file, but named as:
index.md

Full symlink is:

cbergeron@cb-mbp resume (master) $ pwd
/Users/cbergeron/mystuff/blog/chrisbergeron.github.io/source/resume
cbergeron@cb-mbp resume (master) $ ls -l
lrwxr-xr-x  1 cbergeron  staff    43 Oct 21 11:53 index.md@ -> /Users/cbergeron/Documents/Resume/resume.md

Edit the file in Documents to update Resume:

/Users/cbergeron/Documents/Resume/resume.md
