// 2017数学
const QUESTIONS_MATH_2017 = [
  { id:'math-2017-1', year:2017, subject:'ma2', topic:'ma-2', type:'single', question:'若函数f(x在x=0连续，则abab', options:["C. ab = 0","D. ab = 2"], answer:"" },
  { id:'math-2017-3', year:2017, subject:'ma2', topic:'ma-3', type:'single', question:'设数列{xn}收敛，则', options:["A. 当  xn  = 0 时，  xn  = 0","B. 当  xn      时，则  xn   = 0","C. 当 n + x) = 0 ,  = 0","D. 当 n  + sin xn) = 0 时，  xn   = 0"], answer:"" },
  { id:'math-2017-4', year:2017, subject:'ma2', topic:'ma-3', type:'single', question:'微分方程y,,_4y,+8y=e2x(1+cos2x)的特解可设为yk=', options:["A. Ae2x  + e2x (B cos 2x + C sin 2x)","B. Axe2x  + e2x (B cos 2x + C sin 2x)","C. Ae2x  + xe2x (B cos 2x + C sin 2x)","D. Axe2x  + xe2x (B cos 2x + C sin 2x)"], answer:"" },
  { id:'math-2017-5', year:2017, subject:'ma2', topic:'ma-8', type:'single', question:'设f(x,y)具有一阶偏导数，且在任意的(x,y)，都有则', options:["A. f(0, 0) &gt; f(1, 1)","B. f(0, 0) &lt; f(1, 1)","C. f(0, 1) &gt; f(1, 0)","D. f(0, 1) &lt; f(1, 0)"], answer:"" },
  { id:'math-2017-6', year:2017, subject:'ma2', topic:'ma-8', type:'single', question:'甲、乙两人赛跑，计时开始时，甲在乙前方10（单位:m）处,图中，实线表示甲的速度曲线v=v1(t)（单位:m/s）虚线表示乙的速度曲线v=v2(t)，三块阴影部分面积的数值依次为10,20,3，计时开始后乙追上甲的时刻记为t0（单位:s）,则', options:["A. t0  = 10","B. 15 &lt; t0  &lt; 20","C. t0  = 25","D. t0  &gt; 25"], answer:"" },
  { id:'math-2017-7', year:2017, subject:'ma2', topic:'ma-9', type:'single', question:'设A为三阶矩阵，P=(α1,α2,α3)为可逆矩阵，使得P_1AP则A(α1,α2,α3)=', options:["A. α1 + α2","B. α2  + 2α3","C. α2  + α3","D. α1  + 2α2"], answer:"" },
  { id:'math-2017-8', year:2017, subject:'ma2', topic:'ma-9', type:'single', question:'已知矩阵A则', options:["A. A 与 C 相似，B 与 C 相似","B. A 与 C 相似，B 与 C 不相似","C. A 与 C 不相似，B 与 C 相似","D. A 与 C 不相似，B 与 C 不相似"], answer:"" },
  { id:'math-2017-9', year:2017, subject:'ma2', topic:'ma-3', type:'fill', question:'曲线y=x的斜渐近线方程为', options:[], answer:"" },
  { id:'math-2017-10', year:2017, subject:'ma2', topic:'ma-3', type:'fill', question:'设函数y=y(x)由参数方程确定，则', options:[], answer:"" },
  { id:'math-2017-12', year:2017, subject:'ma2', topic:'ma-8', type:'fill', question:'设函数f(x,y)具有一阶连续偏导数，且df(x,y)=yeydx+x(1+y)eydy,f(0,0)=0，则f(x,y)=', options:[], answer:"" },
  { id:'math-2017-14', year:2017, subject:'ma2', topic:'ma-8', type:'fill', question:'设矩阵A的一个特征向量为，则a=', options:[], answer:"" },
  { id:'math-2017-15', year:2017, subject:'ma2', topic:'ma-4', type:'fill', question:'（本题满分10分）求tetdt', options:[], answer:"" },
  { id:'math-2017-16', year:2017, subject:'ma2', topic:'ma-4', type:'fill', question:'（本题满分10分）设函数f(u,v)具有2阶连续偏导数，y=f(ex,cosx),求', options:[], answer:"" },
  { id:'math-2017-17', year:2017, subject:'ma2', topic:'ma-4', type:'fill', question:'（本题满分10分）求ln', options:[], answer:"" },
  { id:'math-2017-18', year:2017, subject:'ma2', topic:'ma-8', type:'fill', question:'（本题满分10分）已知函数y(x)由方程x3+y3_3x+3y_2=0确定，求y(x)的极值', options:[], answer:"" },
  { id:'math-2017-19', year:2017, subject:'ma2', topic:'ma-8', type:'fill', question:'（本题满分10分）设函数f(x)在[0,1]上具有2阶导数，f证明', options:[], answer:"" },
  { id:'math-2017-20', year:2017, subject:'ma2', topic:'ma-8', type:'fill', question:'（本题满分11分）已知平面区域D={(x,y)x2+y2≤2y}，计算二重积分2dxdy', options:[], answer:"" },
  { id:'math-2017-21', year:2017, subject:'ma2', topic:'ma-9', type:'fill', question:'（本题满分11分）设y(x)是区间内的可导函数，且y', options:[], answer:"" },
  { id:'math-2017-22', year:2017, subject:'ma2', topic:'ma-9', type:'fill', question:'（本题满分11分）三阶行列式A=(α1,α2,α3)有3个不同的特征值，且α3=α1+2α2', options:[], answer:"" },
  { id:'math-2017-23', year:2017, subject:'ma2', topic:'ma-9', type:'fill', question:'（本题满分11分）设二次型f(x1,x2,x3)=2x21_x22+ax23+2x1x2_8x1x3+2x2x3在正交变换x=Qy下的标准型为λ1y21+λ2y22求a的值及一个正交矩阵Q.', options:[], answer:"" }
];