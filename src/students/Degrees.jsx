import { motion, AnimatePresence } from "framer-motion";
import { pageVariants, itemVariants } from "../motion";
import {
  FileText,
  Monitor,
  CalendarDays,
  Award,
  TrendingUp,
  Target,
  RefreshCw,
  AlertCircle,
  Clock,
  BarChart3,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  fetchStudentStats,
  fetchPaperExams,
  fetchExamHistory,
  fetchExamResults,
} from "../api/student/actions";

const Degrees = () => {
  const [stats, setStats] = useState(null);
  const [paperExams, setPaperExams] = useState([]);
  const [onlineExams, setOnlineExams] = useState([]);
  const [examResults, setExamResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, paperRes, onlineRes, resultsRes] = await Promise.all([
        fetchStudentStats(),
        fetchPaperExams(),
        fetchExamHistory(),
        fetchExamResults(),
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (paperRes.success) setPaperExams(paperRes.data || []);
      if (onlineRes.success) setOnlineExams(onlineRes.data || []);
      if (resultsRes.success) setExamResults(resultsRes.data || []);
    } catch (err) {
      console.error("Degrees load error:", err);
      setError("فشل تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const toNumber = useCallback((value) => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  }, []);

  const getPercentage = useCallback(
    (exam) => {
      const total =
        exam.examType === "paper" ? exam.total_degree : exam.full_mark;
      const score =
        exam.examType === "paper" ? exam.student_degree : exam.score;
      return total > 0
        ? Math.round((toNumber(score) / toNumber(total)) * 100)
        : 0;
    },
    [toNumber],
  );

  // ✅ استخدام fetchExamResults - دمج النتائج
  const allExams = useMemo(() => {
    const paperWithType = paperExams.map((exam) => ({
      ...exam,
      examType: "paper",
    }));
    const onlineWithType = onlineExams.map((exam) => ({
      ...exam,
      examType: "online",
    }));
    const resultsWithType = examResults.map((exam) => ({
      ...exam,
      examType: "paper_result",
    }));

    return [...paperWithType, ...onlineWithType, ...resultsWithType];
  }, [paperExams, onlineExams, examResults]);

  const filteredExams = useMemo(
    () =>
      allExams.filter((exam) => {
        if (activeTab === "paper")
          return exam.examType === "paper" || exam.examType === "paper_result";
        if (activeTab === "online") return exam.examType === "online";
        return true;
      }),
    [allExams, activeTab],
  );

  const highestScore = useMemo(
    () => (allExams.length > 0 ? Math.max(...allExams.map(getPercentage)) : 0),
    [allExams, getPercentage],
  );

  const avgScore = useMemo(
    () =>
      Math.round(toNumber(stats?.avg_paper_degree || stats?.avg_online_score)),
    [stats, toNumber],
  );

  const totalExamsCount = useMemo(() => allExams.length, [allExams]);
  const paperExamsCount = useMemo(() => paperExams.length, [paperExams]);
  const onlineExamsCount = useMemo(() => onlineExams.length, [onlineExams]);

  const getGrade = useCallback((percentage) => {
    if (percentage >= 85)
      return {
        label: "ممتاز",
        text: "text-green-700",
        bg: "bg-green-100",
        bar: "#16a34a",
      };
    if (percentage >= 75)
      return {
        label: "جيد جداً",
        text: "text-blue-700",
        bg: "bg-blue-100",
        bar: "#3b82f6",
      };
    if (percentage >= 65)
      return {
        label: "جيد",
        text: "text-purple-700",
        bg: "bg-purple-100",
        bar: "#9224EB",
      };
    if (percentage >= 50)
      return {
        label: "مقبول",
        text: "text-orange-700",
        bg: "bg-orange-100",
        bar: "#f59e0b",
      };
    return {
      label: "راسب",
      text: "text-red-700",
      bg: "bg-red-100",
      bar: "#dc2626",
    };
  }, []);

  const performanceData = useMemo(
    () =>
      allExams.map((exam, idx) => ({
        name: `اختبار ${idx + 1}`,
        percentage: getPercentage(exam),
      })),
    [allExams, getPercentage],
  );

  if (loading && !refreshing) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#009966] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm">جاري تحميل الدرجات...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <AlertCircle size={48} className="text-red-400" />
          <p className="text-gray-600">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-[#009966] text-white rounded-lg hover:bg-[#007a52] transition"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.section
      variants={pageVariants}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-4 sm:gap-5 w-full min-h-screen p-3 sm:p-5"
      dir="rtl"
    >
      {/* Header */}
      <motion.header
        variants={itemVariants}
        className="flex items-center justify-between flex-wrap gap-2"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            الدرجات والتقييمات
          </h1>
          <span className="text-sm sm:text-base text-gray-500">
            متابعة درجاتي
          </span>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm font-bold text-gray-600 hover:border-[#009966] transition"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          تحديث
        </button>
      </motion.header>

      {/* Summary Cards */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3"
      >
        <div className="bg-white border-2 border-transparent hover:border-[#009966] hover:translate-y-1 hover:shadow-[8px_5px_0_#009966] transition-all duration-100 rounded-2xl shadow-[5px_2px_0_#009966] p-3 sm:p-5 flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <Target className="text-blue-600" size={20} />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-xl sm:text-3xl block text-gray-900">
              {avgScore}
            </span>
            <span className="text-[10px] sm:text-sm text-gray-500">
              متوسط الدرجات
            </span>
          </div>
        </div>
        <div className="bg-white border-2 border-transparent hover:border-[#009966] hover:translate-y-1 hover:shadow-[8px_5px_0_#009966] transition-all duration-100 rounded-2xl shadow-[5px_2px_0_#009966] p-3 sm:p-5 flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-green-50 flex items-center justify-center shrink-0">
            <TrendingUp className="text-green-600" size={20} />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-xl sm:text-3xl block text-gray-900">
              {highestScore}%
            </span>
            <span className="text-[10px] sm:text-sm text-gray-500">
              أعلى درجة
            </span>
          </div>
        </div>
        <div className="bg-white border-2 border-transparent hover:border-[#009966] hover:translate-y-1 hover:shadow-[8px_5px_0_#009966] transition-all duration-100 rounded-2xl shadow-[5px_2px_0_#009966] p-3 sm:p-5 flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
            <BarChart3 className="text-purple-600" size={20} />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-xl sm:text-3xl block text-gray-900">
              {totalExamsCount}
            </span>
            <span className="text-[10px] sm:text-sm text-gray-500">
              إجمالي الامتحانات
            </span>
          </div>
        </div>
      </motion.div>

      {/* Performance Chart */}
      {performanceData.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-xl border border-gray-200 p-3 sm:p-5"
        >
          <h2 className="font-bold text-sm sm:text-base mb-3 sm:mb-4">
            تطور الأداء
          </h2>
          <div className="h-45 sm:h-55">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} width={30} />
                <Tooltip
                  contentStyle={{ fontSize: "12px", borderRadius: "10px" }}
                />
                <Area
                  type="monotone"
                  dataKey="percentage"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fill="url(#colorScore)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <motion.div
        variants={itemVariants}
        className="flex gap-1 border-b border-gray-200 bg-white rounded-t-xl px-2 overflow-x-auto custom-scrollbar"
      >
        <button
          onClick={() => setActiveTab("all")}
          className={`shrink-0 px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold border-b-2 transition ${
            activeTab === "all"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          الكل ({totalExamsCount})
        </button>
        <button
          onClick={() => setActiveTab("paper")}
          className={`shrink-0 px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold border-b-2 transition ${
            activeTab === "paper"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          ورقي ({paperExamsCount})
        </button>
        <button
          onClick={() => setActiveTab("online")}
          className={`shrink-0 px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold border-b-2 transition ${
            activeTab === "online"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          إلكتروني ({onlineExamsCount})
        </button>
      </motion.div>

      {/* Exam Cards */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex flex-col gap-2.5"
        >
          {filteredExams.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 sm:p-10 text-center">
              <FileText size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">لا توجد امتحانات</p>
            </div>
          ) : (
            filteredExams.map((exam, idx) => {
              const percentage = getPercentage(exam);
              const grade = getGrade(percentage);
              const date =
                exam.examType === "paper" ? exam.exam_date : exam.submitted_at;
              const total =
                exam.examType === "paper" ? exam.total_degree : exam.full_mark;
              const score =
                exam.examType === "paper" ? exam.student_degree : exam.score;

              return (
                <motion.div
                  key={`${exam.examType}-${idx}`}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 hover:shadow-md transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shrink-0 ${
                          exam.examType === "paper"
                            ? "bg-orange-50"
                            : "bg-purple-50"
                        }`}
                      >
                        {exam.examType === "paper" ? (
                          <FileText className="text-orange-600" size={18} />
                        ) : (
                          <Monitor className="text-purple-600" size={18} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-xs sm:text-sm block truncate">
                          {exam.examType === "paper"
                            ? exam.title
                            : exam.exam_title}
                        </span>
                        <span className="text-[10px] sm:text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                          <CalendarDays size={11} />
                          {new Date(date).toLocaleDateString("ar-EG", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-6">
                      <div className="text-center">
                        <span className="font-bold text-base sm:text-lg text-gray-900 block">
                          {score}/{total}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          الدرجة
                        </span>
                      </div>
                      <div className="text-center">
                        <span
                          className="font-bold text-base sm:text-lg block"
                          style={{ color: grade.bar }}
                        >
                          {percentage}%
                        </span>
                        <span className="text-[10px] text-gray-500">
                          النسبة
                        </span>
                      </div>
                      <span
                        className={`text-xs sm:text-sm font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full ${grade.bg} ${grade.text} whitespace-nowrap`}
                      >
                        {grade.label}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5 sm:mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, delay: idx * 0.1 }}
                      className="h-full rounded-full"
                      style={{ background: grade.bar }}
                    />
                  </div>
                </motion.div>
              );
            })
          )}
        </motion.div>
      </AnimatePresence>
    </motion.section>
  );
};

export default Degrees;
