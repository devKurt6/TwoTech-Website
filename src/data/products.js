export const CATS=['Processors','Motherboards','RAM','SSD & HDD','Graphics Cards','Power Supplies','PC Cases','Cooling','Peripherals'];
export const CI={Processors:'chip',Motherboards:'pc',RAM:'ram','SSD & HDD':'disk','Graphics Cards':'gpu','Power Supplies':'psu','PC Cases':'case',Cooling:'fan',Peripherals:'kb'};
export const PRODUCTS=[
['Ryzen 5 5600 (6-core)','Processors',7490,12,'AM4 · 6 cores / 12 threads · 3.5–4.4 GHz · 65W'],
['Core i5-12400F','Processors',8250,5,'LGA1700 · 6 cores / 12 threads · up to 4.4 GHz · No iGPU'],
['B550M Micro-ATX Board','Motherboards',5890,8,'AM4 · DDR4 · M.2 NVMe · Micro-ATX'],
['B660M DDR4 Board','Motherboards',5650,0,'LGA1700 · DDR4 · M.2 · Micro-ATX'],
['16GB DDR4 3200 Kit (2×8GB)','RAM',2090,25,'DDR4 · 3200 MHz · CL16 · Desktop DIMM'],
['32GB DDR5 5600 Kit (2×16GB)','RAM',5990,3,'DDR5 · 5600 MHz · CL36 · Desktop DIMM'],
['500GB NVMe SSD','SSD & HDD',2190,30,'M.2 2280 · PCIe 3.0 · up to 3,400 MB/s read'],
['1TB 7200RPM HDD','SSD & HDD',2450,14,'3.5" SATA · 7200 RPM · 64MB cache'],
['RTX 4060 8GB','Graphics Cards',18900,4,'8GB GDDR6 · 115W · 1× 8-pin power'],
['RX 6600 8GB','Graphics Cards',12900,0,'8GB GDDR6 · 132W · 1× 8-pin power'],
['650W 80+ Bronze PSU','Power Supplies',2890,10,'650W · 80+ Bronze · ATX · 120mm fan'],
['Mid-Tower ATX Case','PC Cases',2490,9,'ATX / mATX · 2 front fans · Tempered glass side'],
['120mm ARGB Case Fan (3-pack)','Cooling',1190,40,'120mm · ARGB · 1,500 RPM · 3-pin controller'],
['Tower CPU Cooler','Cooling',1390,16,'4 heat pipes · 120mm fan · Intel & AMD mounts'],
['Mechanical Keyboard (TKL)','Peripherals',1990,11,'Tenkeyless · Red switches · USB-C'],
['Wireless Mouse','Peripherals',690,22,'2.4 GHz · 1600 DPI · AA battery']
].map((p,i)=>({id:i+1,name:p[0],cat:p[1],price:p[2],stock:p[3],specs:p[4],desc:`${p[0]} — a dependable pick for builds and upgrades. Ask us to check compatibility with your existing parts before you buy.`}));
