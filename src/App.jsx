import React, { useState, useEffect, useRef } from "react";
import students from "../public/students.json";
import Convert from "./pages/convert";

const App = () => {
  const [admissionNo, setAdmissionNo] = useState("");
  const [student, setStudent] = useState(null);
  const [amount, setAmount] = useState("");
  const [requestQueue, setRequestQueue] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Refs for the input fields
  const admissionNoInputRef = useRef(null);
  const amountInputRef = useRef(null);

  useEffect(() => {
    // Initialize sheet URL from environment
    const sheetUrl = import.meta.env.VITE_SHEETURL;
    if (!sheetUrl) {
      console.error("VITE_SHEETURL environment variable is not set");
    }

    // Focus the admission number input when the component mounts (page loads)
    if (admissionNoInputRef.current) {
      admissionNoInputRef.current.focus();
    }
  }, []); // Empty dependency array means this runs only once on mount

  // 🔵 Add request to queue
  const addToQueue = (payload) => {
    const newRequest = {
      id: Date.now(),
      ...payload,
      status: "pending", // pending, loading, success, error
      timestamp: new Date().toLocaleTimeString()
    };
    setRequestQueue(prev => [...prev, newRequest]);
  };

  // 🔍 Handle Search by Admission Number
  const handleSearch = () => {
    const found = students.find((s) => String(s.admissionNo) === admissionNo.trim());
    if (found) {
      setStudent(found);
      // Focus the amount input field when a student is found
      if (amountInputRef.current) {
        amountInputRef.current.focus();
      }
    } else {
      setStudent(null);
      alert("Student not found!");
      // Optionally clear focus from amount field if student not found
      if (amountInputRef.current) {
        amountInputRef.current.blur();
      }
    }
  };

  // Handle Enter key press in admission number input
  const handleAdmissionNoKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission if inside a form
      handleSearch();
    }
  };

  // 🟢 Handle Submit Payment (adds to queue)
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!student || !amount) {
      alert("Missing student or amount.");
      // If missing, keep focus on the respective field if possible
      if (!student) {
         // Student is missing, focus admission number
         if (admissionNoInputRef.current) {
             admissionNoInputRef.current.focus();
         }
      } else if (!amount) {
          // Amount is missing, focus amount
          if (amountInputRef.current) {
              amountInputRef.current.focus();
          }
      }
      return;
    }

    addToQueue({
      admissionNo,
      name: student.name,
      class: student.class,
      amount
    });

    // Reset form
    setAdmissionNo("");
    setStudent(null);
    setAmount("");
    // Refocus the admission number input after successful submission
    if (admissionNoInputRef.current) {
      admissionNoInputRef.current.focus();
    }
  };

  // 🔄 Process queue items one by one
  useEffect(() => {
    if (requestQueue.length > 0 && !isProcessing) {
      const nextRequest = requestQueue.find(req => req.status === "pending");
      if (nextRequest) {
        processRequest(nextRequest.id);
      }
    }
  }, [requestQueue, isProcessing]);

  // 🔄 Process individual request
  const processRequest = async (requestId) => {
    setIsProcessing(true);
    
    setRequestQueue(prev => 
      prev.map(req => 
        req.id === requestId ? { ...req, status: "loading" } : req
      )
    );

    try {
      const request = requestQueue.find(req => req.id === requestId);
      const sheetUrl = import.meta.env.VITE_SHEETURL;
      
      const res = await fetch(sheetUrl, {
        method: "POST",
        body: JSON.stringify(request),
      });

      const data = await res.json();
      setRequestQueue(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: data.status === "success" ? "success" : "error", message: data.message } 
            : req
        )
      );
    } catch (err) {
      console.error(err);
      setRequestQueue(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: "error", message: "Failed to submit payment." } 
            : req
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // 🟡 Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "success": return "bg-green-900 text-green-200 border-green-700";
      case "error": return "bg-red-900 text-red-200 border-red-700";
      case "loading": return "bg-blue-900 text-blue-200 border-blue-700";
      default: return "bg-gray-800 text-gray-200 border-gray-700";
    }
  };

  // 🟡 Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "success": 
        return (
          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        );
      case "error":
        return (
          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        );
      case "loading":
        return (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
        );
      default:
        return (
          <div className="w-4 h-4 rounded-full bg-gray-500"></div>
        );
    }
  };

  return (
    <>
    {/* <Convert/> */}
    {/* Dark background for the entire app */}
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col md:flex-row">
      {/* Main Form Section */}
      <div className="md:w-2/3 p-6">
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
          <h1 className="text-2xl font-semibold text-gray-100 mb-6">Fee Submission Portal</h1>

          {/* Admission No Search */}
          <div className="flex gap-3 mb-6">
            <input
              type="number"
              placeholder="Enter Admission No"
              value={admissionNo}
              onChange={(e) => setAdmissionNo(e.target.value)}
              onKeyDown={handleAdmissionNoKeyDown} // Add keydown handler
              ref={admissionNoInputRef} // Assign the ref to the admission no input
              className="flex-1 px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400"
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </div>

          {/* Show Student Details */}
          {student && (
            <div className="bg-gray-700 rounded-md p-4 mb-6 text-gray-200 space-y-2 border border-gray-600">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Name</p>
                  <p className="font-medium">{student.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Class</p>
                  <p className="font-medium">{student.class}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Team</p>
                  <p className="font-medium">{student.team || "—"}</p>
                </div>
              </div>
            </div>
          )}

          {/* Amount + Submit */}
          {student && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-300 font-medium mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  placeholder="Enter Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  ref={amountInputRef} // Assign the ref to the amount input
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 text-white rounded-md font-medium transition-colors hover:bg-blue-700"
              >
                Add to Queue
              </button>
            </form>
          )}

          <p className="text-center text-gray-400 mt-6 text-sm">
            Requests will be processed sequentially in the queue
          </p>
        </div>
      </div>

      {/* Queue Status Section */}
      <div className="md:w-1/3 p-6">
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6 h-full">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">Request Queue</h2>
          
          {requestQueue.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No requests in queue</p>
              <p className="text-sm mt-1">Submit a payment to see it here</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
              {[...requestQueue].reverse().map((request) => (
                <div 
                  key={request.id} 
                  className={`p-3 rounded-md border ${getStatusColor(request.status)} text-sm`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(request.status)}
                      <span className="font-medium capitalize">{request.status}</span>
                    </div>
                    <span className="text-xs text-gray-400">{request.timestamp}</span>
                  </div>
                  
                  <div className="mt-2 space-y-1">
                    <p className="font-medium truncate">{request.name}</p>
                    <div className="flex justify-between text-xs">
                      <span>Adm: {request.admissionNo}</span>
                      <span className="font-semibold">₹{request.amount}</span>
                    </div>
                    {request.message && (
                      <p className="text-xs mt-1 text-gray-300 truncate">{request.message}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default App;