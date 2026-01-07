docker ps > status.txt 2>&1
echo "--- LSOF 3333 ---" >> status.txt
lsof -i :3333 >> status.txt 2>&1
echo "--- LSOF 5433 ---" >> status.txt
lsof -i :5433 >> status.txt 2>&1
