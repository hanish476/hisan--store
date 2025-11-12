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
      case "success": return "bg-green-50 text-green-700 border-green-200";
      case "error": return "bg-red-50 text-red-700 border-red-200";
      case "loading": return "bg-blue-50 text-blue-700 border-blue-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  // 🟡 Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "success": 
        return (
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        );
      case "error":
        return (
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        );
      case "loading":
        return (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        );
      default:
        return (
          <div className="w-4 h-4 rounded-full bg-gray-400"></div>
        );
    }
  };

  return (
    <>
    {/* <Convert/> */}
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Main Form Section */}
      <div className="md:w-2/3 p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-semibold text-gray-800 mb-6">Fee Submission Portal</h1>

          {/* Admission No Search */}
          <div className="flex gap-3 mb-6">
            <input
              type="number"
              placeholder="Enter Admission No"
              value={admissionNo}
              onChange={(e) => setAdmissionNo(e.target.value)}
              onKeyDown={handleAdmissionNoKeyDown} // Add keydown handler
              ref={admissionNoInputRef} // Assign the ref to the admission no input
              className="flex-1 px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 border-gray-300 bg-white text-gray-800"
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
            <div className="bg-gray-50 rounded-md p-4 mb-6 text-gray-700 space-y-2 border border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{student.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Class</p>
                  <p className="font-medium">{student.class}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Team</p>
                  <p className="font-medium">{student.team || "—"}</p>
                </div>
              </div>
            </div>
          )}

          {/* Amount + Submit */}
          {student && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  placeholder="Enter Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  ref={amountInputRef} // Assign the ref to the amount input
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 border-gray-300 bg-white text-gray-800"
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

          <p className="text-center text-gray-500 mt-6 text-sm">
            Requests will be processed sequentially in the queue
          </p>
        </div>
      </div>

      {/* Queue Status Section */}
      <div className="md:w-1/3 p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Request Queue</h2>
          
          {requestQueue.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
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
                    <span className="text-xs text-gray-500">{request.timestamp}</span>
                  </div>
                  
                  <div className="mt-2 space-y-1">
                    <p className="font-medium truncate">{request.name}</p>
                    <div className="flex justify-between text-xs">
                      <span>Adm: {request.admissionNo}</span>
                      <span className="font-semibold">₹{request.amount}</span>
                    </div>
                    {request.message && (
                      <p className="text-xs mt-1 text-gray-600 truncate">{request.message}</p>
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